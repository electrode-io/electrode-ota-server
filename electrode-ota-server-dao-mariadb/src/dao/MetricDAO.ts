import { IConnection } from "mysql";

import { MetricInDTO, MetricOutDTO, MetricByStatusOutDTO } from "../dto";

import { DeploymentQueries, MetricQueries } from "../queries";

import BaseDAO from "./BaseDAO";

import PackageDAO from "./PackageDAO";

export default class MetricDAO extends BaseDAO {
    public static async insertMetric(connection: IConnection, metric: MetricInDTO): Promise<void> {
        const depResults = await MetricDAO.query(connection, DeploymentQueries.getDeploymentByKey,
            [metric.deploymentKey]);

        if (!depResults || depResults.length === 0) {
            throw new Error("Not found. no deployment found for key [" + metric.deploymentKey + "]");
        }

        return await MetricDAO.query(connection, MetricQueries.insertMetric,
            [depResults[0].id, metric.appVersion, metric.clientUniqueId, metric.label,
            metric.previousDeploymentKey, metric.previousLabelOrAppVersion, metric.status]);
    }

    public static async metrics(connection: IConnection, deploymentKey: string): Promise<MetricOutDTO[]> {
        const depResults = await MetricDAO.query(connection, DeploymentQueries.getDeploymentByKey, [deploymentKey]);

        if (!depResults || depResults.length === 0) {
            throw new Error("Not found. no deployment found for key [" + deploymentKey + "]");
        }

        const metricResults = await MetricDAO.query(connection, MetricQueries.getMetricsForDeployment,
            [depResults[0].id]);
        return metricResults.map((result: any) => {
            const dto = new MetricOutDTO();
            dto.deploymentkey = deploymentKey;
            dto.clientuniqueid = result.client_unique_id;
            dto.appversion = result.app_version;
            dto.label = result.label;
            dto.status = result.status;
            dto.previousdeploymentkey = result.previous_deployment_key;
            dto.previouslabelorappversion = result.previous_label_or_app_version;
            return dto;
        });
    }

    public static async metricsByStatus(connection: IConnection, deploymentKey: string): Promise<MetricByStatusOutDTO[]> {
        const depResults = await MetricDAO.query(connection, DeploymentQueries.getDeploymentByKey, [deploymentKey]);

        if (!depResults || depResults.length === 0) {
            throw new Error("Not found. no deployment found for key [" + deploymentKey + "]");
        }
        const metricResults = await MetricDAO.query(connection, MetricQueries.getMetricsForDeploymentByStatus,
            [depResults[0].id]);
        return metricResults.map((result: any) => {
            const dto = new MetricByStatusOutDTO();
            dto.deploymentkey = deploymentKey;
            dto.appversion = result.app_version;
            dto.label = result.label;
            dto.status = result.status;
            dto.previousdeploymentkey = result.previous_deployment_key;
            dto.previouslabelorappversion = result.previous_label_or_app_version;
            dto.total = result.total;
            return dto;
        });
    }

    public static async metricsByStatusAndTime(connection: IConnection, deploymentKey: string, startDate: Date, endDate: Date): Promise<MetricByStatusOutDTO[]> {
        const depResults = await MetricDAO.query(connection, DeploymentQueries.getDeploymentByKey, [deploymentKey]);

        if (!depResults || depResults.length === 0) {
            throw new Error("Not found. no deployment found for key [" + deploymentKey + "]");
        }
        const metricResults = await MetricDAO.query(connection, MetricQueries.getMetricsForDeploymentByStatusAndTime,
            [depResults[0].id, startDate.getTime()/1000, endDate.getTime()/1000]);
        return metricResults.map((result: any) => {
            const dto = new MetricByStatusOutDTO();
            dto.deploymentkey = deploymentKey;
            dto.appversion = result.app_version;
            dto.label = result.label;
            dto.status = result.status;
            dto.previousdeploymentkey = result.previous_deployment_key;
            dto.previouslabelorappversion = result.previous_label_or_app_version;
            dto.total = result.total;
            return dto;
        });
    }

    public static async metricsByStatusAfterSpecificTime(connection: IConnection, deploymentKey: string, specificDate: Date): Promise<MetricByStatusOutDTO[]> {
        const depResults = await MetricDAO.query(connection, DeploymentQueries.getDeploymentByKey, [deploymentKey]);
        if (!depResults || depResults.length === 0) {
            throw new Error("Not found. no deployment found for key [" + deploymentKey + "]");
        }

        const latestVersions = await PackageDAO.getMostRecentlyPromotedVersions(connection);
        const isPromotedRecently = latestVersions && latestVersions.length > 0;
        const key = isPromotedRecently ? "version" : "noversion";
        const allQueries:{[key:string]: string;} = {
            "version": MetricQueries.getMetricsByStatusAfterSpecificTimeAndVersion,
            "noversion": MetricQueries.getMetricsByStatusAfterSpecificTime
        }
        const allParams:{[key:string]:any} = {
            "version": [depResults[0].id, specificDate, ...latestVersions],
            "noversion": [depResults[0].id, specificDate]
        }

        const metricResults = await MetricDAO.query(connection, allQueries[key], allParams[key]);
        return metricResults.map((result: any) => {
            const dto = new MetricByStatusOutDTO();
            dto.deploymentkey = deploymentKey;
            dto.appversion = result.app_version;
            dto.label = result.label;
            dto.status = result.status;
            dto.previousdeploymentkey = result.previous_deployment_key;
            dto.previouslabelorappversion = result.previous_label_or_app_version;
            dto.total = result.total;
            return dto;
        });
    }
}
