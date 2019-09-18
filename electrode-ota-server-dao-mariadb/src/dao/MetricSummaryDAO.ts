import { IConnection } from "mysql";
import { MetricSummaryDTO, DeploymentDTO } from "../dto";
import { MetricSummaryQueries } from "../queries";
import BaseDAO from "./BaseDAO";
import DeploymentDAO from "./DeploymentDAO";

export default class MetricSummaryDAO extends BaseDAO {
  public static async acquireMetricLock(
    connection: IConnection,
    deploymentKey: string,
    acquirer: string,
    lockExpireUTC: Date
  ): Promise<MetricSummaryDTO | undefined> {
    const deployment = await DeploymentDAO.deploymentForKey(connection, deploymentKey);
    await MetricSummaryDAO.beginTransaction(connection);
    try {
      let nowUTC: Date = new Date(Date.now());
      let summary = await MetricSummaryDAO.getSummaryByDeploymentId(connection, deployment.id);
      if (typeof summary === "undefined") {
        summary = new MetricSummaryDTO();
        summary.deploymentId = deployment.id;
        summary.lastRunTimeUTC = new Date(0);
        summary.summaryJson = "{}";
      }
      if (!summary.lockTimeUTC || summary.lockTimeUTC < nowUTC) {
        summary.lockBy = acquirer;
        summary.lockTimeUTC = lockExpireUTC;
        await MetricSummaryDAO.addOrUpdateMetricSummary(connection, summary);
        let savedSummary = MetricSummaryDAO.getSummaryByDeploymentId(connection, deployment.id);
        await MetricSummaryDAO.commit(connection);
        return savedSummary;
      } else {
        await MetricSummaryDAO.commit(connection);
        return;
      }
    } catch (err) {
      await MetricSummaryDAO.rollback(connection);
      throw err;
    }
  }
  public static async releaseMetricLock(
    connection: IConnection,
    summary: MetricSummaryDTO
  ): Promise<void> {
    return MetricSummaryDAO.query(connection, MetricSummaryQueries.updateSummaryById, [
      null,
      null,
      summary.lastRunTimeUTC,
      summary.summaryJson,
      summary.id
    ]);
  }

  public static async getMetricSummary(
    connection: IConnection,
    deploymentKey: string
  ): Promise<MetricSummaryDTO | undefined> {
    const deployment = await DeploymentDAO.deploymentForKey(connection, deploymentKey);
    return MetricSummaryDAO.getSummaryByDeploymentId(connection, deployment.id);
  }

  public static async addOrUpdateMetricSummary(
    connection: IConnection,
    metric: MetricSummaryDTO
  ): Promise<void> {
    if (!metric.id) {
      return MetricSummaryDAO.query(connection, MetricSummaryQueries.insertSummary, [
        metric.deploymentId,
        metric.lockBy,
        metric.lockTimeUTC,
        metric.lastRunTimeUTC,
        metric.summaryJson
      ]);
    }
    return MetricSummaryDAO.query(connection, MetricSummaryQueries.updateSummaryById, [
      metric.lockBy,
      metric.lockTimeUTC,
      metric.lastRunTimeUTC,
      metric.summaryJson,
      metric.id
    ]);
  }

  private static async getSummaryByDeploymentId(
    connection: IConnection,
    deploymentId: number
  ): Promise<MetricSummaryDTO | undefined> {
    const results = await MetricSummaryDAO.query(
      connection,
      MetricSummaryQueries.getSummaryByDeploymentId,
      [deploymentId]
    );
    if (results && results.length === 0) {
      return;
    }
    return MetricSummaryDAO.resultsToDTO(results[0]);
  }

  private static resultsToDTO(result: any): MetricSummaryDTO {
    const outgoing = new MetricSummaryDTO();
    outgoing.id = result.id;
    outgoing.deploymentId = result.deployment_id;
    outgoing.lastRunTimeUTC = result.last_run_time;
    outgoing.lockBy = result.lock_by;
    outgoing.lockTimeUTC = result.lock_time;
    outgoing.summaryJson = result.summary_json;
    return outgoing;
  }
}
