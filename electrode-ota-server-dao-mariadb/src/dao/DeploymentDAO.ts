import { IConnection } from "mysql";
import { DeploymentAppQueries, DeploymentPackageQueries, DeploymentQueries } from "../queries";

import BaseDAO from "./BaseDAO";
import PackageDAO from "./PackageDAO";

import { DeploymentDTO } from "../dto";

import { find } from "lodash";

export default class DeploymentDAO extends BaseDAO {
    public static async addDeployment(connection: IConnection, appId: number, deploymentName: string,
                                      additional: any): Promise<DeploymentDTO> {

        const currentDeploymentResults = await DeploymentDAO.getDeploymentsByAppId(connection, appId);
        const existing = find(currentDeploymentResults, { deployment_key : additional.key });
        if (existing) {
            throw new Error("Deployment with key [" + additional.key + "] already exists");
        }

        const inTx = DeploymentDAO.isInTransaction();

        if (!inTx) {
            await DeploymentDAO.beginTransaction(connection);
        }

        const insertResult = await DeploymentDAO.insertDeployment(connection, deploymentName, additional);
        const depId = insertResult.insertId;
        await DeploymentDAO.insertDeploymentApp(connection, appId, depId);

        if (!inTx) {
            await DeploymentDAO.commit(connection);
        }

        const outgoing = new DeploymentDTO();
        outgoing.id = depId;
        outgoing.key = additional.key;
        outgoing.name = deploymentName;

        return outgoing;
    }

    public static async removeDeployment(connection: IConnection, appId: number,
                                         deploymentName: string): Promise<void> {
        const deployments = await DeploymentDAO.getDeploymentsByApp(connection, appId);
        const found = find(deployments, { name : deploymentName });

        if (!found) {
            throw new Error("Not found. No deployment found for appId [" + appId +
                "] and name [" + deploymentName + "]");
        }

        // const inTx = DeploymentDAO.isInTransaction;

        // if (!inTx) {
        await DeploymentDAO.beginTransaction(connection);
        // }

        await DeploymentDAO.query(connection, DeploymentPackageQueries.deleteDeploymentPackageByDeploymentId,
            [found.id]);
        await DeploymentDAO.query(connection, DeploymentAppQueries.deleteDeploymentAppByDeploymentId,
            [found.id]);
        await DeploymentDAO.query(connection, DeploymentQueries.deleteDeploymentById, [found.id]);

        // if (!inTx) {
        await DeploymentDAO.commit(connection);
        // }

        return;
    }

    public static async renameDeployment(connection: IConnection, appId: number,
                                         oldDeploymentName: string, newDeploymentName: string): Promise<void> {
        const deployments = await DeploymentDAO.getDeploymentsByApp(connection, appId);
        const found = find(deployments, { name : oldDeploymentName });

        if (!found) {
            throw new Error("Not found. No deployment found for appId [" + appId +
                "] and name [" + oldDeploymentName + "]");
        }

        return await DeploymentDAO.query(connection, DeploymentQueries.updateDeploymentName,
            [newDeploymentName, found.id]);
    }

    public static async deploymentForKey(connection: IConnection, deploymentKey: string): Promise<DeploymentDTO> {
        const depResults = await DeploymentDAO.query(connection, DeploymentQueries.getDeploymentByKey, [deploymentKey]);

        if (!depResults || depResults.length === 0) {
            throw new Error("Not found. no deployment found for key [" + deploymentKey + "]");
        }

        return await DeploymentDAO.createDeploymentFromResult(connection, depResults[0]);
    }

    public static async deploymentsByApp(connection: IConnection, appId: number,
                                         deploymentNames: string[]): Promise<any> {
        const depResults = await DeploymentDAO.query(connection, DeploymentQueries.getDeploymentsByAppId, [appId]);

        const resultsWeCareAbout = depResults.filter((result: any) => {
            return deploymentNames.indexOf(result.name) >= 0;
        });

        const deployments = await Promise.all<DeploymentDTO>(resultsWeCareAbout.map((result: any) => {
            return DeploymentDAO.createDeploymentFromResult(connection, result);
        }));

        if (deployments.length === 0) {
            throw new Error("Not found.  no deployments found for app [" + appId +
                "] and deployments [" + deploymentNames.join(",") + "]");
        }

        const mapByName = deployments.reduce((obj, deployment) => {
            obj[deployment.name] = deployment;
            return obj;
        }, {} as any);

        return mapByName;
    }

    public static async deploymentByApp(connection: IConnection, appId: number,
                                        deploymentName: string): Promise<DeploymentDTO> {
        const depResults = await DeploymentDAO.query(connection, DeploymentQueries.getDeploymentsByAppId, [appId]);

        const found = find(depResults, { name : deploymentName });
        if (found) {
            return await DeploymentDAO.createDeploymentFromResult(connection, found);
        } else {
            throw new Error("Not found. no deployment found for app id [" + appId +
                "] and deployment key [" + deploymentName + "]");
        }
    }

    public static async getDeploymentsByApp(connection: IConnection, appId: number): Promise<DeploymentDTO[]> {
        const deploymentResults = await DeploymentDAO.getDeploymentsByAppId(connection, appId);
        return await Promise.all<DeploymentDTO>(deploymentResults.map((result: any) => {
            return DeploymentDAO.createDeploymentFromResult(connection, result);
        }));
    }

    private static async createDeploymentFromResult(connection: IConnection, result: any): Promise<DeploymentDTO> {
        const deployment = new DeploymentDTO();
        deployment.id = result.id;
        deployment.key = result.deployment_key;
        deployment.name = result.name;
        deployment.createTime = result.create_time;
        deployment.package = await PackageDAO.getLatestPackageForDeployment(connection, deployment.id);
        deployment.history_ = await DeploymentDAO.getDeploymentPackageIds(connection, result.id);
        return deployment;
    }

    private static async getDeploymentsByAppId(connection: IConnection, appId: number): Promise<any> {
        return DeploymentDAO.query(connection, DeploymentAppQueries.getDeploymentsByAppId, [appId]);
    }

    private static async insertDeployment(connection: IConnection, name: string,
                                          additional: any): Promise<any> {
        return DeploymentDAO.query(connection, DeploymentQueries.insertDeployment, [name, additional.key]);
    }

    private static async insertDeploymentApp(connection: IConnection, appId: number, depId: number): Promise<any> {
        return DeploymentDAO.query(connection, DeploymentAppQueries.insertDeploymentApp, [appId, depId]);
    }

    private static async getDeploymentPackageIds(connection: IConnection, depId: number): Promise<any> {
        return DeploymentDAO.query(connection, DeploymentPackageQueries.getHistoryByDeploymentId,
                [depId]).then((results) => {
            return results.map((result: any) => result.package_id);
        });
    }

    /*
    private static transformOutgoingDeploymentsAsObj(results: any[]): any {
        return results.reduce((obj, depResult) => {
            obj[depResult.deployment_key] = {
                createdTime : depResult.create_time,
                id : depResult.id,
                key : depResult.deployment_key,
                name : depResult.name,
            };
            return obj;
        }, {} as any);
    }
    */
}
