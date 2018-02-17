import { IConnection } from "mysql";
import {
    AppPermissionQueries,
    AppQueries,
    DeploymentAppQueries,
    DeploymentPackageQueries,
    DeploymentQueries,
    UserQueries,
} from "../queries";

import BaseDAO from "./BaseDAO";
import DeploymentDAO from "./DeploymentDAO";
import HistoryDAO from "./HistoryDAO";
import PackageDAO from "./PackageDAO";

import { AppDTO } from "../dto";

import { difference, findKey } from "lodash";

const OWNER = "Owner";
const COLLAB = "Collaborator";

export default class AppDAO extends BaseDAO {
    public static async createApp(connection: IConnection, app: AppDTO): Promise<AppDTO> {
        await AppDAO.beginTransaction(connection);

        const insertResults = await AppDAO.insertApp(connection, app.name);
        const appId = insertResults.insertId;
        const outgoing = new AppDTO();
        outgoing.id = appId;
        outgoing.name = app.name;

        if (app.collaborators && Object.keys(app.collaborators).length > 0) {
            try {
                outgoing.collaborators = await AppDAO.createAppPermissions(connection, appId, app.collaborators);
            } catch (err) {
                AppDAO.rollback(connection);
                throw(err);
            }
        } else {
            AppDAO.rollback(connection);
            throw new Error("Expected app.collaborators to be provided");
        }

        if (app.deployments && Object.keys(app.deployments).length > 0) {
            await Promise.all(Object.keys(app.deployments).map((deploymentName) => {
                return DeploymentDAO.addDeployment(connection, appId, app.deployments[deploymentName].name, {
                    key : app.deployments[deploymentName].key,
                });
            }));
            const deployments = await DeploymentDAO.getDeploymentsByApp(connection, appId);
            // outgoing app.deployments is expected to be an array of the deployment names
            outgoing.deployments = deployments.map((deployment) => deployment.name);
        }
        await AppDAO.commit(connection);

        return outgoing;
    }

    public static async appById(connection: IConnection, appId: number): Promise<AppDTO> {
        const appResults = await AppDAO.getAppById(connection, appId);
        if (appResults && appResults.length === 0) {
            throw new Error("App not found for app id [" + appId + "]");
        }
        const outgoing = new AppDTO();
        outgoing.id = appResults[0].id;
        outgoing.name = appResults[0].name;
        return outgoing;
    }

    public static async appsForCollaborator(connection: IConnection, email: string): Promise<AppDTO[]> {
        const appResults = await AppDAO.query(connection, AppPermissionQueries.getAppPermissionsByUserEmail, [email]);
        const apps = new Array<AppDTO>();
        let prevAppId;
        let appDTO = new AppDTO();

        for (const appResult of appResults) {
            if (appResult.app_id !== prevAppId) {
                appDTO = new AppDTO();
                appDTO.id = appResult.app_id;
                appDTO.name = appResult.app_name;
                appDTO.collaborators = {};
                apps.push(appDTO);
            }

            appDTO.collaborators[appResult.sub_email] = {
                permission : appResult.sub_permission,
            };
            prevAppId = appResult.app_id;
        }


        await Promise.all(apps.map((app) => AppDAO.populateAppDetails(connection, app)));

        return apps;
    }

    public static async appForCollaborator(connection: IConnection, email: string,
                                           name: string): Promise<AppDTO | undefined> {
        const appResults = await AppDAO.query(connection,
                                            AppQueries.getAppByAppNameAndCollaboratorEmail, [email, name]);
        if (!appResults || appResults.length === 0) {
            return undefined;
        }

        const outgoing = new AppDTO();
        outgoing.id = appResults[0].id;
        outgoing.name = appResults[0].name;

        await AppDAO.populateAppDetails(connection, outgoing);

        return outgoing;
    }

    public static async appForDeploymentKey(connection: IConnection, deploymentKey: string): Promise<AppDTO> {
        const appResults = await AppDAO.query(connection,
            AppQueries.getAppByDeploymentKey, [deploymentKey]);

        if (!appResults || appResults.length === 0) {
            throw new Error("Not found; app not found for deployment key [" + deploymentKey + "]");
        }

        const outgoing = new AppDTO();
        outgoing.id = appResults[0].id;
        outgoing.name = appResults[0].name;

        await AppDAO.populateAppDetails(connection, outgoing);

        return outgoing;
    }

    public static async updateApp(connection: IConnection, appId: number, updateInfo: AppDTO): Promise<AppDTO> {
        /*
            This function handles these use cases.
            - rename an app
            - transfer ownership of an app
            - add a collaborator
            - remove a collaborator
        */

        const existing = await AppDAO.appById(connection, appId);
        existing.collaborators = await AppDAO.getAppPermissionsByAppId(connection, appId)
            .then(AppDAO.transformOutgoingAppPermissions);

        // is the app getting renamed
        if (existing.name !== updateInfo.name) {
            const results = await AppDAO.updateAppName(connection, appId, updateInfo.name);
            existing.name = updateInfo.name;
            return existing;
        }

        // is the app transferring ownership
        const currentOwnerEmail = findKey(existing.collaborators, { permission : OWNER });
        const updatedOwnerEmail = findKey(updateInfo.collaborators, { permission : OWNER });

        if (currentOwnerEmail && updatedOwnerEmail && currentOwnerEmail !== updatedOwnerEmail) {
            const currentOwnerUser = await AppDAO.getUserByEmail(connection, currentOwnerEmail);
            const updateOwnerUser = await AppDAO.getUserByEmail(connection, updatedOwnerEmail);

            const updatePermissions = [{
                permission : COLLAB,
                userId : currentOwnerUser[0].id,
            }, {
                permission : OWNER,
                userId : updateOwnerUser[0].id,
            }];

            existing.collaborators = await AppDAO.updateAppPermissions(connection, appId, updatePermissions);
            return existing;
        }

        // is a collaborator being added
        const newCollaboratorsEmails = difference(Object.keys(updateInfo.collaborators),
                                                Object.keys(existing.collaborators));
        if (newCollaboratorsEmails.length > 0) {
            const newPermissions = newCollaboratorsEmails.map((email: string) => {
                return {
                    email,
                    permission : COLLAB,
                };
            });
            existing.collaborators = await AppDAO.insertAppPermissions(connection, appId, newPermissions);
            return existing;
        }

        // is a collaborator being removed
        const remCollaboratorEmails = difference(Object.keys(existing.collaborators),
                                                Object.keys(updateInfo.collaborators));
        if (remCollaboratorEmails.length > 0) {
            existing.collaborators = await AppDAO.removeAppPermissionsForUsers(connection, appId,
                remCollaboratorEmails);
        }

        return existing;
    }

    public static async removeApp(connection: IConnection, appId: number): Promise<void> {
        /*
            Need to remove
            - app
            - app_permission
            - deployment_app
            - deployment
            - package
            - deployment_package_history
            - package_diff
            - client_ratio
        */

        await AppDAO.beginTransaction(connection);
        await AppDAO.deleteDeploymentRelated(connection, appId);
        await AppDAO.deleteAppRelated(connection, appId);
        await AppDAO.commit(connection);
    }

    private static async populateAppDetails(connection: IConnection, outgoing: AppDTO) {
        outgoing.collaborators = await AppDAO.getAppPermissionsByAppId(connection, outgoing.id)
            .then(AppDAO.transformOutgoingAppPermissions);

        const deployments = await DeploymentDAO.getDeploymentsByApp(connection, outgoing.id);
        // outgoing app.deployments is expected to be an array of the deployment keys
        outgoing.deployments = deployments.map((deployment) => deployment.name);
    }

    private static async getAppById(connection: IConnection, appId: number): Promise<any> {
        return AppDAO.query(connection, AppQueries.getAppById, [appId]);
    }

    /*
    private static async getAppByName(connection: IConnection, appName: string): Promise<any> {
        return AppDAO.query(connection, AppQueries.getAppByName, [appName]);
    }
    */

    private static async insertApp(connection: IConnection, appName: string): Promise<any> {
        return AppDAO.query(connection, AppQueries.insertApp, [appName]);
    }

    private static async createAppPermissions(connection: IConnection, appId: number,
                                              collaborators: any): Promise<any> {
        return Promise.all(Object.keys(collaborators).map(async (collaboratorEmail) => {
            const userResults = await AppDAO.getUserByEmail(connection, collaboratorEmail);
            if (!userResults || userResults.length === 0) {
                throw new Error("User with email [" + collaboratorEmail + "] not found");
            }

            const userId = userResults[0].id;

            await AppDAO.insertAppPermission(connection, appId, userId, collaborators[collaboratorEmail].permission);
        })).then(() => AppDAO.getAppPermissionsByAppId(connection, appId).then(AppDAO.transformOutgoingAppPermissions));
    }

    /*
    private static async getUsersByEmails(connection: IConnection, emails: string[]): Promise<any> {
        return AppDAO.query(connection, UserQueries.getUsersByEmails, ["(" + emails.join(",") + ")"]);
    }
    */

    private static async getUserByEmail(connection: IConnection, email: string): Promise<any> {
        return AppDAO.query(connection, UserQueries.getUserByEmail, [email]);
    }

    private static async insertAppPermissions(connection: IConnection, appId: number,
                                              appPermissions: any[]): Promise<any> {
        return Promise.all(appPermissions.map((appPermission) => {
            return AppDAO.insertAppPermissionWithEmail(connection, appId, appPermission.email,
                appPermission.permission);
        })).then(() => AppDAO.getAppPermissionsByAppId(connection, appId).then(AppDAO.transformOutgoingAppPermissions));
    }

    private static async insertAppPermissionWithEmail(connection: IConnection,
                                                      appId: number, email: string, permission: string): Promise<any> {
        return AppDAO.query(connection, AppPermissionQueries.insertAppPermissionWithEmail, [appId, email, permission]);
    }

    private static async insertAppPermission(connection: IConnection, appId: number,
                                             userId: number, permission: string): Promise<any> {
        return AppDAO.query(connection, AppPermissionQueries.insertAppPermission, [appId, userId, permission]);
    }

    private static async getAppPermissionsByAppId(connection: IConnection, appId: number): Promise<any> {
        return AppDAO.query(connection, AppPermissionQueries.getAppPermissionsByAppId, [appId]);
    }

    private static transformOutgoingAppPermissions(permissions: any[]): any {
        // convert array to object with email as the key
        return permissions.reduce((obj, permission) => {
            obj[permission.email] = {
                permission : permission.permission,
            };
            return obj;
        }, {});
    }

    private static async updateAppName(connection: IConnection, appId: number, name: string): Promise<any> {
        return AppDAO.query(connection, AppQueries.updateAppName, [name, appId]);
    }

    private static async updateAppPermissions(connection: IConnection, appId: number,
                                              appPermissions: any[]): Promise<any> {
        return Promise.all(appPermissions.map((appPermission) => {
            return AppDAO.updateAppPermission(connection, appId,
                appPermission.userId, appPermission.permission).then((updateResults) => {
                    if (updateResults.affectedRows === 0) {
                        return AppDAO.insertAppPermission(connection, appId, appPermission.userId,
                            appPermission.permission);
                    }
                });
        })).then(() => AppDAO.getAppPermissionsByAppId(connection, appId).then(AppDAO.transformOutgoingAppPermissions));
    }

    private static async updateAppPermission(connection: IConnection, appId: number, userId: number,
                                             permission: string): Promise<any> {
        return AppDAO.query(connection, AppPermissionQueries.updateAppPermission, [permission, appId, userId]);
    }

    private static async removeAppPermissionsForUsers(connection: IConnection, appId: number,
                                                      emails: string[]): Promise<any> {
        return Promise.all(emails.map((email) => {
            return AppDAO.removeAppPermissionByEmail(connection, appId, email);
        })).then(() => AppDAO.getAppPermissionsByAppId(connection, appId).then(AppDAO.transformOutgoingAppPermissions));
    }

    private static async removeAppPermissionByEmail(connection: IConnection, appId: number,
                                                    email: string): Promise<any> {
        return AppDAO.query(connection, AppPermissionQueries.deleteAppPermissionByUserEmail, [appId, email]);
    }

    private static async deleteAppRelated(connection: IConnection, appId: number): Promise<void> {
        // delete app_permission
        await AppDAO.query(connection, AppPermissionQueries.deleteAppPermissionByAppId, [appId]);

        // delete app record
        await AppDAO.query(connection, AppQueries.deleteApp, [appId]);
    }

    private static async deleteDeploymentRelated(connection: IConnection, appId: number): Promise<void> {
        const deployments = await DeploymentDAO.getDeploymentsByApp(connection, appId);
        await Promise.all(deployments.map(async (deployment) => {
            await AppDAO.deletePackageRelated(connection, deployment.id);

            // delete deployment_app
            await AppDAO.query(connection, DeploymentAppQueries.deleteDeploymentAppByDeploymentId, [deployment.id]);

            // delete deployment
            await AppDAO.query(connection, DeploymentQueries.deleteDeploymentById, [deployment.id]);
        }));
    }

    private static async deletePackageRelated(connection: IConnection, deploymentId: number): Promise<void> {
        const histories = await HistoryDAO.historyForDeployment(connection, deploymentId);
        await Promise.all(
            histories.map(async (history: any) => PackageDAO.removePackage(connection, history.package_id)));
    }
}
