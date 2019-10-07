import { AppDTO,
        ClientRatioDTO,
        DeploymentDTO,
        MetricInDTO,
        MetricOutDTO,
        MetricSummaryDTO,
        MetricByStatusOutDTO,
        PackageDTO,
        UserDTO } from "./dto";
// import { App, ClientRatio, Deployment, Metric, Package, User } from "./entities";

export interface IElectrodeOtaDao {
    connect(options: any): Promise<void>;
    close(): Promise<void>;
    disconnect(): Promise<void>;

    createUser(user: UserDTO): Promise<UserDTO>;
    userByEmail(email: string): Promise<UserDTO>;
    updateUser(currentEmail: string, updateInfo: UserDTO): Promise<UserDTO>;
    userByAccessKey(accessKey: string): Promise<UserDTO>;
    userById(id: string): Promise<UserDTO>;

    createApp(appInfo: AppDTO): Promise<AppDTO>;
    updateApp(appId: number, appInfo: AppDTO): Promise<AppDTO>;
    removeApp(appId: number): Promise<void>;
    appById(appId: number): Promise<AppDTO>;
    appsForCollaborator(email: string): Promise<AppDTO[]>;
    appForCollaborator(email: string, name: string): Promise<AppDTO | undefined>;
    appForDeploymentKey(deploymentKey: string): Promise<AppDTO>;

    addDeployment(appId: number, deploymentName: string, additional: any): Promise<DeploymentDTO>;
    removeDeployment(appId: number, deploymentName: string): Promise<void>;
    renameDeployment(appId: number, oldDeploymentName: string, newDeploymentName: string): Promise<void>;
    deploymentForKey(deploymentKey: string): Promise<DeploymentDTO>;
    deploymentsByApp(appId: number, deploymentNames: string[]): Promise<any>;
    deploymentByApp(appId: number, deploymentName: string): Promise<DeploymentDTO>;
    getDeployments():Promise<DeploymentDTO[]>;

    packageById(packageId: number): Promise<PackageDTO>;
    addPackage(deploymentKey: string, packageInfo: PackageDTO): Promise<PackageDTO>;
    // update the package along with diff-maps and tags
    updatePackage(deploymentKey: string, packageInfo: any, label: string): Promise<PackageDTO>;
    // Add package diff map
    addPackageDiffMap(deploymentKey: string, packageInfo: PackageDTO, packageHash: string): Promise<any>;
    getNewestApplicablePackage(deploymentKey: string, tags: string[] | undefined, appVersion: string | undefined): Promise<PackageDTO | void>;

    history(appId: number, deploymentName: string): Promise<PackageDTO[]>;
    historyByIds(historyIds: number[]): Promise<PackageDTO[]>;
    clearHistory(appId: number, deploymentName: string): Promise<void>;
    historyLabel(appId: number, deploymentName: string, label: string): Promise<PackageDTO>;

    upload(packageHash: string, content: any): Promise<void>;
    download(packageHash: string): Promise<Buffer>;

    insertMetric(metric: MetricInDTO): Promise<void>;
    metrics(deploymentKey: string): Promise<MetricOutDTO[]>;
    metricsByStatus(deploymentKey: string): Promise<MetricByStatusOutDTO[]>;
    metricsByStatusAndTime(deploymentKey: string, start:Date, end:Date): Promise<MetricByStatusOutDTO[]>;

    clientRatio(clientUniqueId: string, packageHash: string): Promise<ClientRatioDTO | undefined>;
    insertClientRatio(clientUniqueId: string, packageHash: string,
                      ratio: number, updated: boolean): Promise<void>;

    getMetricSummary(deploymentKey:string): Promise<MetricSummaryDTO | undefined>;
    addOrUpdateMetricSummary(summary: MetricSummaryDTO): Promise<void>;
    acquireMetricLock(deploymentKey:string, acquirer: string, lockExpireUTC:Date): Promise<MetricSummaryDTO | undefined>;
    releaseMetricLock(summary: MetricSummaryDTO): Promise<void>;
}
