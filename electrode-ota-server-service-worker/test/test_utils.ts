import {
  AppDTO,
  DeploymentDTO,
  MetricInDTO,
  MetricByStatusOutDTO,
  MetricSummaryDTO,
  UserDTO
} from "electrode-ota-server-dao-mariadb";

export function clearTables(connection: any): Promise<any> {
  const tables = [
    "metric",
    "metrics_summary",
    "client_ratio",
    "package_content",
    "package_tag",
    "package_diff",
    "deployment_package_history",
    "package",
    "deployment_app",
    "deployment",
    "app_permission",
    "app",
    "access_key",
    "user_auth_provider",
    "user"
  ];

  return Promise.all(
    tables.map(table => {
      return new Promise((resolve, reject) => {
        connection.query("DELETE FROM " + table + " WHERE 1 = 1", (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    })
  );
}

export function createUserDTO(email: string, name: string, accessKeys: any): UserDTO {
  const userDTO = new UserDTO();
  userDTO.email = email;
  userDTO.name = name;
  userDTO.accessKeys = accessKeys;
  return userDTO;
}

export function createAppDTO(name: string, collaborators: any, deployments: any): AppDTO {
  const appDTO = new AppDTO();
  appDTO.name = name;
  appDTO.collaborators = collaborators;
  appDTO.deployments = deployments;
  return appDTO;
}

export function createDeploymentDTO(
  id: any,
  key: any,
  name: any,
  pkg: any,
  history: any
): DeploymentDTO {
  const d = new DeploymentDTO();
  d.id = id;
  d.key = key;
  d.name = name;
  d.createTime = new Date();
  d.package = pkg;
  d.history_ = history;
  return d;
}

export function createMetricsInDTO(
  key: any,
  version: any,
  label: string,
  status: string
): MetricInDTO {
  const m = new MetricInDTO();
  m.deploymentKey = key;
  (m.appVersion = version),
    (m.clientUniqueId = "ABC1234"),
    (m.label = label),
    (m.previousDeploymentKey = "");
  m.previousLabelOrAppVersion = "";
  m.status = status;
  return m;
}

export function createMetricsOutDTO(
  key: any,
  version: any,
  label: any,
  status: any,
  total: number,
  prevversion: any = null
): MetricByStatusOutDTO {
  const m = new MetricByStatusOutDTO();
  m.deploymentkey = key;
  m.appversion = version;
  m.label = label;
  m.previousdeploymentkey = "";
  m.previouslabelorappversion = prevversion;
  m.status = status;
  m.total = total;
  return m;
}

export function createMetricSummaryDTO(
  deploymentId: number,
  lastRunTimeUTC: Date,
  summaryJson: string,
  lockBy?: string,
  lockTime?: Date
): MetricSummaryDTO {
  const s = new MetricSummaryDTO();
  s.deploymentId = deploymentId;
  s.summaryJson = summaryJson;
  s.lastRunTimeUTC = lastRunTimeUTC;
  s.lockBy = lockBy;
  s.lockTimeUTC = lockTime;
  return s;
}
export function insertAppAndUser(dao: any, userDTO: UserDTO, appDTO: AppDTO) {
  return dao.createUser(userDTO).then((createdUser: any) => dao.createApp(appDTO));
}

export function insertMetrics(dao: any, metrics: any[]): Promise<any> {
  return Promise.all(
    metrics.map((m: any) => {
      return dao.insertMetric(m);
    })
  );
}

export async function modifyMetricsCreateTime(
  dao: any,
  deploymentKey: string,
  createTime: Date
): Promise<any> {
  const connection: any = await dao.getConnection();
  const deployment: any = await dao.deploymentForKey(deploymentKey);
  await new Promise((resolve, reject) => {
    connection.query(
      `update metric set create_time=? where deployment_id=?`,
      [createTime, deployment.id],
      (err: any) => {
        if (err) {
          reject(err);
        }
        resolve();
      }
    );
  });
  connection.release();
}
