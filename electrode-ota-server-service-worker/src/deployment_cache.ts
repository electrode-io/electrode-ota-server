import { DeploymentDTO, MetricSummaryDTO } from "electrode-ota-server-dao-mariadb";

const HOUR_MS = 3600 * 1000;
// const TWOFOUR_HOURS_MS = 24 * HOUR_MS;

/***
 * Get list of deployments
 *    Refresh list every x hours
 * Iterator over deployments
 *    Mark when deployment is done
 *    Iterator does not include done
 */

export default class DeploymentCache {
  private dao: any;
  private deployments: DeploymentDTO[];
  private nextIdx: number;
  private deploymentCacheExpire: Date;
  private doneList: any;

  constructor(dao: any) {
    this.dao = dao;
    this.deployments = [];
    this.doneList = {};
    this.nextIdx = 0;
    this.deploymentCacheExpire = new Date(0);
  }

  public status() {
    return {
      deployments: this.deployments.length,
      done: this.doneList,
      next: this.nextIdx
    }
  }

  public async next(): Promise<DeploymentDTO | boolean> {
    await this._refreshCache();

    const len = this.deployments.length;
    if (len === 0) return false;
    const startIdx = this.nextIdx;
    do {
      const dep = this.deployments[this.nextIdx];
      this.nextIdx += 1;
      if (this.nextIdx >= len) this.nextIdx = 0;

      const req = await this._requireSummarize(dep);
      if (req) {
        return dep;
      }
    } while (this.nextIdx !== startIdx);
    return false;
  }

  /*
  public getDeploymentList(): DeploymentDTO[] {
    return this.deployments;
  }
  */

  private async _refreshCache() {
    let now = new Date(Date.now());
    if (this.deploymentCacheExpire <= now) {
      this.deployments = await this.dao.getDeployments();
      this.doneList = {};
      this.nextIdx = 0;
      this.deploymentCacheExpire = new Date(Date.now() + 2*HOUR_MS);
    }
  }

  private async _requireSummarize(deployment: DeploymentDTO) {
    const now = new Date(Date.now());
    if (this.doneList[deployment.id]) {
      if (this.doneList[deployment.id].done) return false;
      else if (this.doneList[deployment.id].lockTill > now)
       return false;
    }

    const summary: MetricSummaryDTO = await this.dao.getMetricSummary(deployment.key);
    if (typeof summary === "undefined") {
      // Not summarized
      return true;
    }

    if (summary.lockTimeUTC && summary.lockTimeUTC > now) {
      this.doneList[deployment.id] = { done: false, lockTill: summary.lockTimeUTC };
      return false;
    }

    const lastHour: Date = new Date(Date.now() - HOUR_MS);
    if (summary.lastRunTimeUTC < lastHour) {
      // not summarized in last hour
      return true;
    }

    // already summarized in last hour
    this.doneList[deployment.id] = { done: true };
    return false;
  }
}
