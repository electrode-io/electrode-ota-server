import { hostname } from "os";
import { DeploymentDTO, MetricSummaryDTO } from "electrode-ota-server-dao-mariadb";
import DeploymentCache from "./deployment_cache";

const HOUR_MS = 3600 * 1000;
const TWO_HOURS_MS = 2 * HOUR_MS;

export const LOGGING_DEBUG = 1;
export const LOGGING_INFO = 2;
export const LOGGING_ERROR = 3;

export interface OptionsType {
  sleepSec: number;
  summationRangeInHours: number;
  lockExpirationInHours: number;
  logging: number;
}

const noOp = () => {};

export default class Summarizor {
  private options: OptionsType;
  private dao: any;
  private timeout: any | null = null;
  private logger: any;
  private isStopped: boolean;
  private hostname: string;
  private stopPromise: Promise<any> | null;
  private dpCache: DeploymentCache;
  private _debugLogging: Function;
  private _infoLogging: Function;
  private _errorLogging: Function;

  constructor(options: OptionsType, dao: any, logger: any) {
    this.options = options;
    this.dao = dao;
    this.logger = logger;
    this.isStopped = false;
    this.stopPromise = new Promise(() => {});
    this.dpCache = new DeploymentCache(dao);
    this.hostname = hostname();

    this._debugLogging = this.options.logging === LOGGING_DEBUG ? this._logInfo : noOp;
    this._infoLogging = this.options.logging <= LOGGING_INFO ? this._logInfo : noOp;
  }

  private _logInfo(msg: string) {
    this.logger.info(this.hostname, msg);
  }

  public async start() {
    this.logger.info(this.hostname, "Starting");

    while (!this.isStopped) {
      this._debugLogging(`Begin work loop`);
      await this._doWork();
      if (!this.isStopped) {
        this._debugLogging(`Sleeping for ${this.options.sleepSec}`);
        await Promise.race([this.stopPromise, this.sleep(this.options.sleepSec * 1000)]);
      }
    }

    this.logger.info(this.hostname, "Stopped");
  }

  public async stop() {
    this._debugLogging(`Stop called`);
    this.isStopped = true;
    if (this.timeout) {
      clearTimeout(this.timeout!);
      this.timeout = null;
    }
    Promise.resolve(this.stopPromise);
  }

  private sleep(ms: number) {
    return new Promise(resolve => (this.timeout = setTimeout(resolve, ms)));
  }

  public async test_summarize(
    deployment: DeploymentDTO,
    metricsSummary: MetricSummaryDTO,
    startUTC: Date,
    endUTC: Date
  ): Promise<MetricSummaryDTO | never> {
    return this._summarize(deployment, metricsSummary, startUTC, endUTC);
  }

  public async test_run_loop() {
    return this._doWork();
  }

  private async _summarize(
    deployment: DeploymentDTO,
    metricsSummary: MetricSummaryDTO,
    startPeriodUTC: Date,
    endPeriodUTC: Date
  ): Promise<MetricSummaryDTO | never> {
    let current = JSON.parse(metricsSummary.summaryJson);
    const metrics = await this.dao.metricsByStatusAndTime(
      deployment.key,
      startPeriodUTC,
      endPeriodUTC
    );
    this._infoLogging(
      `Summarize start: key=${deployment.key} new-metrics=${metrics.length} current=${
        metricsSummary.summaryJson
      }`
    );
    const { label } = deployment.package || { label: "" };
    let summary = metrics.reduce((accumulator: any, val: any) => {
      const key = val.label || val.appversion;
      const ret =
        accumulator[key] ||
        (accumulator[key] = {
          active: 0,
          downloaded: 0,
          installed: 0,
          failed: 0
        });
      switch (val.status) {
        case "DeploymentSucceeded":
          ret.active += val.total;
          if (val.previouslabelorappversion) {
            //previous deployment is no longer active.
            if (accumulator[val.previouslabelorappversion]) {
              accumulator[val.previouslabelorappversion].active -= val.total;
            } else {
              // metrics is not ordered, so previous label not necessary in accumulator yet
              accumulator[val.previouslabelorappversion] = {
                active: -val.total,
                downloaded: 0,
                installed: 0,
                failed: 0
              };
            }
          }
          ret.installed += val.total;
          break;
        case "DeploymentFailed":
          ret.failed += val.total;
          break;
        case "Downloaded":
          ret.downloaded += val.total;
          break;
      }
      return accumulator;
    }, current);

    for (let k in summary) {
      // Zero out negative active counts.
      // Negative counts can occur if the previous active < current active
      summary[k].active = summary[k].active > 0 ? summary[k].active : 0;
    }
    metricsSummary.summaryJson = JSON.stringify(summary);
    metricsSummary.lastRunTimeUTC = endPeriodUTC;
    this._infoLogging(
      `Summarize complete: key=${deployment.key} new=${metricsSummary.summaryJson}`
    );
    return metricsSummary;
  }

  private _getSummationEndPeriod(metricsSummary: MetricSummaryDTO) {
    let summaryPeriod;
    if (metricsSummary.lastRunTimeUTC.getTime() === 0) {
      // Never summarized, start at 1/1/2019
      summaryPeriod = new Date(Date.UTC(2019, 1, 1, 0, 0, 0));
    } else {
      summaryPeriod = new Date(
        Math.min(
          metricsSummary.lastRunTimeUTC.getTime() + this.options.summationRangeInHours * HOUR_MS,
          Date.now()
        )
      );
      summaryPeriod.setUTCMinutes(0, 0, 0);
    }
    return summaryPeriod;
  }

  private async _doWork() {
    let maybeDeployment: DeploymentDTO | boolean = false;
    let lockExpireTime: Date = new Date(Date.now() + this.options.lockExpirationInHours * HOUR_MS);

    try {
      maybeDeployment = await this.dpCache.next();
      if (maybeDeployment !== false) {
        let deployment = maybeDeployment as DeploymentDTO;
        let metricsSummary = await this.dao.acquireMetricLock(
          deployment.key,
          this.hostname,
          lockExpireTime
        );
        if (metricsSummary) {
          let summaryPeriod = this._getSummationEndPeriod(metricsSummary);

          let updatedSummary = await this._summarize(
            deployment,
            metricsSummary,
            metricsSummary.lastRunTimeUTC,
            summaryPeriod
          );
          await this.dao.releaseMetricLock(updatedSummary);
          this._infoLogging(`Summarize timestamp: key=${deployment.key} lastRun=${updatedSummary.lastRunTimeUTC}`);
          return true;
        } else {
          this._infoLogging(`Fail to acquire lock for: key=${deployment!.key}`);
        }
      } else {
        this._infoLogging(`No deployment to work on: ${JSON.stringify(this.dpCache.status())}`);
      }
    } catch (err) {
      this.logger.error(
        this.hostname,
        ` Error summarizing deployment ${
          maybeDeployment !== false ? (maybeDeployment as DeploymentDTO).key : "[no deployment]"
        }, retry later.  Error: ${err.toString()}`
      );
    }
    return false;
  }
}
