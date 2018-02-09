import { IConnection } from "mysql";

import BaseDAO from "./BaseDAO";
import DeploymentDAO from "./DeploymentDAO";
import PackageDAO from "./PackageDAO";

import { DeploymentDTO, PackageDTO } from "../dto";

import { DeploymentPackageQueries } from "../queries";

export default class HistoryDAO extends BaseDAO {
    public static async history(connection: IConnection, appId: number, deploymentName: string): Promise<PackageDTO[]> {
        // looks to return the list of packages for a deployment; sorted by package create time.. descending?
        const deployment = await HistoryDAO.getDeploymentByAppAndName(connection, appId, deploymentName);
        const history = await HistoryDAO.historyForDeployment(connection, deployment.id);
        return Promise.all<PackageDTO>(history.map((depHistory: any) => {
            return PackageDAO.packageById(connection, depHistory.package_id);
        })).then((results) => results.sort((a, b) => b.created_.getTime() - a.created_.getTime()));
    }

    public static async historyByIds(connection: IConnection, historyIds: number[]): Promise<PackageDTO[]> {
        return Promise.all<PackageDTO>(historyIds.map((pkgId) => {
            return PackageDAO.packageById(connection, pkgId);
        }));
    }

    public static async clearHistory(connection: IConnection, appId: number, deploymentName: string): Promise<void> {
        // deletes all packages for the given app and deployment
        const packages = await HistoryDAO.history(connection, appId, deploymentName);

        await HistoryDAO.beginTransaction(connection);
        await Promise.all(packages.map((pkg) => PackageDAO.removePackage(connection, pkg.id)));
        await HistoryDAO.commit(connection);
    }

    public static async historyLabel(connection: IConnection, appId: number, deploymentName: string,
                                     label: string): Promise<PackageDTO> {
        // gets a package for an app and deployment by label
        const packages = await HistoryDAO.history(connection, appId, deploymentName);
        if (!packages || packages.length === 0) {
            throw new Error("Not found. no packages deployed for appId [" + appId +
                "] and deployment [" + deploymentName + "]");
        }

        const found = packages.find((pkg) => {
            return pkg.label === label;
        });

        if (!found) {
            throw new Error("Not found. No package for label [" + label + "] in deployment history for app [" +
                appId + "] deployment [" + deploymentName + "]");
        }
        return found;
    }

    // these public functions are only used in data layer; not a public api
    public static async historyForDeployment(connection: IConnection, deploymentId: number): Promise<any> {
        return await HistoryDAO.getHistoryByDeployment(connection, deploymentId);
    }

    public static async addHistory(connection: IConnection, deploymentId: number, pkgId: number): Promise<any> {
        return await HistoryDAO.insertHistory(connection, deploymentId, pkgId);
    }
    // =================

    private static async getHistoryByDeployment(connection: IConnection, deploymentId: number): Promise<any> {
        return HistoryDAO.query(connection, DeploymentPackageQueries.getHistoryByDeploymentId, [deploymentId]);
    }

    private static async insertHistory(connection: IConnection, deploymentId: number, pkgId: number) {
        return HistoryDAO.query(connection, DeploymentPackageQueries.insertDeploymentPackageHistory,
            [deploymentId, pkgId]);
    }

    private static async getDeploymentByAppAndName(connection: IConnection, appId: number,
                                                   deploymentName: string): Promise<DeploymentDTO> {
        const appDeployments = await DeploymentDAO.getDeploymentsByApp(connection, appId);
        if (appDeployments.length === 0) {
            throw new Error("Not found. No deployments found for appId [" + appId + "]");
        }

        const deployment = appDeployments.find((dep) => {
            // apparently sometimes he's gonna pass it in as an array with only one element. :-/
            return dep.name === deploymentName || deploymentName.indexOf(dep.name) >= 0;
        });

        if (!deployment) {
            throw new Error("Not found. No deployment with name [" + deploymentName +
                "] was found for appId [" + appId + "]");
        }

        return deployment;
    }
}
