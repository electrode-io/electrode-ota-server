// tslint:disable-next-line:no-var-requires
Promise = require("bluebird");
import { createPoolCluster, IConnection, IPoolCluster, IPoolClusterConfig, IPoolConfig } from "mysql";
import { AppDAO,
         ClientRatioDAO,
         DeploymentDAO,
         HistoryDAO,
         MetricDAO,
         MetricSummaryDAO,
         PackageDAO,
         UserDAO } from "./dao";
import { AppDTO,
         ClientRatioDTO,
         DeploymentDTO,
         MetricInDTO,
         MetricOutDTO,
         MetricSummaryDTO,
         PackageDTO,
         UserDTO,
         MetricByStatusOutDTO} from "./dto";
import { IElectrodeOtaDao } from "./IElectrodeOtaDao";
import { AccessKeyQueries, UserQueries } from "./queries";

export default class ElectrodeOtaDaoRdbms implements IElectrodeOtaDao {
    private cluster: IPoolCluster;
    private testCluster: IPoolCluster;

    public connect(options: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.testCluster) {
                this.cluster = this.testCluster;
            } else {
                this.cluster = createPoolCluster(options.clusterConfig);
            }

            options.poolConfigs.forEach((poolConfig: IPoolConfig) => {
                this.cluster.add(poolConfig);
            });
            this.cluster.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                }

                // connected!
                resolve();
            });
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cluster.end((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public getConnection(): Promise<IConnection> {
        return new Promise((resolve, reject) => {
            this.cluster.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    // USER functions ============

    public async createUser(user: UserDTO): Promise<UserDTO> {
        return this.connectAndExecute<UserDTO>((connection) => {
            return UserDAO.createUser(connection, user);
        });
    }

    public async userByEmail(email: string): Promise<UserDTO> {
        return this.connectAndExecute<UserDTO>((connection) => {
            return UserDAO.userByEmail(connection, email);
        });
    }

    public async updateUser(currentEmail: string, updateInfo: UserDTO): Promise<UserDTO> {
        return this.connectAndExecute<UserDTO>((connection) => {
            return UserDAO.updateUser(connection, currentEmail, updateInfo);
        });
    }

    public async userByAccessKey(accessKey: string): Promise<UserDTO> {
        return this.connectAndExecute<UserDTO>((connection) => {
            return UserDAO.userByAccessKey(connection, accessKey);
        });
    }

    public async userById(id: string): Promise<UserDTO> {
        return this.connectAndExecute<UserDTO>((connection) => {
            return UserDAO.userById(connection, parseInt(id, 10));
        });
    }

    // APP functions ===============

    public async createApp(appInfo: AppDTO): Promise<AppDTO> {
        return this.connectAndExecute<AppDTO>((connection) => {
            return AppDAO.createApp(connection, appInfo);
        });
    }

    public async updateApp(appId: number, appInfo: AppDTO): Promise<AppDTO> {
        return this.connectAndExecute<AppDTO>((connection) => {
            return AppDAO.updateApp(connection, appId, appInfo);
        });
    }

    public async removeApp(appId: number): Promise<void> {
        return this.connectAndExecute<void>((connection) => {
            return AppDAO.removeApp(connection, appId);
        });
    }

    public async appById(appId: number): Promise<AppDTO> {
        return this.connectAndExecute<AppDTO>((connection) => {
            return AppDAO.appById(connection, appId);
        });
    }

    public async appsForCollaborator(email: string): Promise<AppDTO[]> {
        return this.connectAndExecute<AppDTO[]>((connection) => {
            return AppDAO.appsForCollaborator(connection, email);
        });
    }

    public async appForCollaborator(email: string, name: string): Promise<AppDTO | undefined> {
        return this.connectAndExecute<AppDTO | undefined>((connection) => {
            return AppDAO.appForCollaborator(connection, email, name);
        });
    }

    public async appForDeploymentKey(deploymentKey: string): Promise<AppDTO> {
        return this.connectAndExecute<AppDTO>((connection) => {
            return AppDAO.appForDeploymentKey(connection, deploymentKey);
        });
    }

    // DEPLOYMENT functions ===============

    public async addDeployment(appId: number, deploymentName: string, additional: any): Promise<DeploymentDTO> {
        return this.connectAndExecute<DeploymentDTO>((connection) => {
            return DeploymentDAO.addDeployment(connection, appId, deploymentName, additional);
        });
    }

    public async removeDeployment(appId: number, deploymentName: string): Promise<void> {
        return this.connectAndExecute((connection) => {
            return DeploymentDAO.removeDeployment(connection, appId, deploymentName);
        });
    }

    public async renameDeployment(appId: number, oldDeploymentName: string, newDeploymentName: string): Promise<void> {
        return this.connectAndExecute((connection) => {
            return DeploymentDAO.renameDeployment(connection, appId, oldDeploymentName, newDeploymentName);
        });
    }

    public async deploymentForKey(deploymentKey: string): Promise<DeploymentDTO> {
        return this.connectAndExecute<DeploymentDTO>((connection) => {
            return DeploymentDAO.deploymentForKey(connection, deploymentKey);
        });
    }

    public async deploymentsByApp(appId: number, deploymentNames: string[]): Promise<any> {
        return this.connectAndExecute<any>((connection) => {
            return DeploymentDAO.deploymentsByApp(connection, appId, deploymentNames);
        });
    }

    public async deploymentByApp(appId: number, deploymentName: string): Promise<DeploymentDTO> {
        return this.connectAndExecute<DeploymentDTO>((connection) => {
            return DeploymentDAO.deploymentByApp(connection, appId, deploymentName);
        });
    }

    // PACKAGE functions =================

    public async packageById(packageId: number): Promise<PackageDTO> {
        return this.connectAndExecute<PackageDTO>((connection) => {
            return PackageDAO.packageById(connection, packageId);
        });
    }

    public async addPackage(deploymentKey: string, packageInfo: PackageDTO): Promise<PackageDTO> {
        return this.connectAndExecute<PackageDTO>((connection) => {
            return PackageDAO.addPackage(connection, deploymentKey, packageInfo);
        });
    }

    // Updates the package, including labels and diff maps
    public async updatePackage(deploymentKey: string, packageInfo: any, label: string): Promise<PackageDTO> {
        return this.connectAndExecute<PackageDTO>((connection) => {
            return PackageDAO.updatePackage(connection, deploymentKey, packageInfo, label);
        });
    }
    // Add package diff-map
    public async addPackageDiffMap(deploymentKey: string, packageInfo: PackageDTO, packageHash: string): Promise<any> {
        return this.connectAndExecute<PackageDTO>((connection) => {
            return PackageDAO.addPackageDiffMap(connection, deploymentKey, packageInfo, packageHash);
        });
    }

    public async getNewestApplicablePackage(deploymentKey: string,
                                            tags: string[] | undefined,
                                            appVersion: string | undefined): Promise<PackageDTO | void> {
        return this.connectAndExecute<PackageDTO | void>((conection) => {
            return PackageDAO.getNewestApplicablePackage(conection, deploymentKey, tags, appVersion);
        });
    }

    // HISTORY functions ==================

    public async history(appId: number, deploymentName: string): Promise<PackageDTO[]> {
        return this.connectAndExecute<PackageDTO[]>((connection) => {
            return HistoryDAO.history(connection, appId, deploymentName);
        });
    }

    public async historyByIds(historyIds: number[]): Promise<PackageDTO[]> {
        return this.connectAndExecute<PackageDTO[]>((connection) => {
            return HistoryDAO.historyByIds(connection, historyIds);
        });
    }

    public async clearHistory(appId: number, deploymentName: string): Promise<void> {
        return this.connectAndExecute((connection) => {
            return HistoryDAO.clearHistory(connection, appId, deploymentName);
        });
    }

    public async historyLabel(appId: number, deploymentName: string, label: string): Promise<PackageDTO> {
        return this.connectAndExecute<PackageDTO>((connection) => {
            return HistoryDAO.historyLabel(connection, appId, deploymentName, label);
        });
    }

    // CLIENT RATIO functions =============

    public async clientRatio(clientUniqueId: string, packageHash: string): Promise<ClientRatioDTO | undefined> {
        return this.connectAndExecute((connection) => {
            return ClientRatioDAO.clientRatio(connection, clientUniqueId, packageHash);
        });
    }

    public async insertClientRatio(clientUniqueId: string, packageHash: string,
                                   ratio: number, updated: boolean): Promise<void> {
        return this.connectAndExecute((connection) => {
            return ClientRatioDAO.insertClientRatio(connection, clientUniqueId, packageHash,
                ratio, updated);
        });
    }

    // METRIC functions =================

    public async insertMetric(metric: MetricInDTO): Promise<void> {
        return this.connectAndExecute((connection) => {
            return MetricDAO.insertMetric(connection, metric);
        });
    }

    public async metrics(deploymentKey: string): Promise<MetricOutDTO[]> {
        return this.connectAndExecute((connection) => {
            return MetricDAO.metrics(connection, deploymentKey);
        });
    }

    public async metricsByStatus(deploymentKey: string): Promise<MetricByStatusOutDTO[]> {
        return this.connectAndExecute((connection) => {
            return MetricDAO.metricsByStatus(connection, deploymentKey);
        })
    }

    public async getMetricSummary(deploymentKey: string): Promise<MetricSummaryDTO | undefined> {
        return this.connectAndExecute((connection) => {
            return MetricSummaryDAO.getMetricSummary(connection, deploymentKey);
        })
    }

    public async addOrUpdateMetricSummary(summary: MetricSummaryDTO): Promise<void> {
        return this.connectAndExecute((connection) => {
            return MetricSummaryDAO.addOrUpdateMetricSummary(connection, summary);
        });
    }

    public async isSummaryRequired(deploymentKey:string, lastRunTimeUTC: Date): Promise<boolean> {
        return this.connectAndExecute((connection) => {
            return MetricSummaryDAO.isSummaryRequired(connection, deploymentKey, lastRunTimeUTC);
        })
    }

    public async acquireMetricLock(deploymentKey:string, acquirer: string, lockExpireUTC:Date): Promise<MetricSummaryDTO | undefined>{
        return this.connectAndExecute((connection) => {
            return MetricSummaryDAO.acquireMetricLock(connection, deploymentKey, acquirer, lockExpireUTC);
        });
    }

    public async releaseMetricLock(summary: MetricSummaryDTO): Promise<void> {
        return this.connectAndExecute((connection) => {
            return MetricSummaryDAO.releaseMetricLock(connection, summary);
        })
    }

    // UPLOAD / DOWNLOAD functions ===========

    public async upload(packageHash: string, content: Buffer): Promise<void> {
        return this.connectAndExecute((connection) => {
            return PackageDAO.savePackageContent(connection, packageHash, content);
        });
    }

    public async download(packageHash: string): Promise<Buffer> {
        return this.connectAndExecute((connection) => {
            return PackageDAO.getPackageContent(connection, packageHash);
        });
    }

    protected setPoolClusterForTest(c: IPoolCluster) {
        this.testCluster = c;
    }

    /**
     * Wrapper function that handles getting the connection and releasing it
     * @param daoMethod method that accepts a connection and returns a promise resolving with type T
     */
    private async connectAndExecute<T>(daoMethod: (connection: IConnection) => Promise<T>): Promise<T> {
        const connection = await this.getConnection();

        await this.setConnectionProperties(connection);

        return daoMethod(connection).then((ret) => {
            connection.release();
            return ret;
        }).catch((err) => {
            connection.release();
            return Promise.reject(err);
        });
    }

    private async setConnectionProperties(connection: IConnection): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            connection.query("SET SESSION AUTOCOMMIT = 1;", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
