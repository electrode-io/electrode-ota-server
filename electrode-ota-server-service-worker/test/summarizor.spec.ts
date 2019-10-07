"use strict";

import Summarizor, { LOGGING_INFO } from "../src/summarizor";
import { daoFactory, shutdown } from "../src/dao_factory";
import { expect } from "chai";
import { resolve } from "path";
import { MetricSummaryDTO } from "electrode-ota-server-dao-mariadb";
import {
  createUserDTO,
  createAppDTO,
  createMetricsInDTO,
  createDeploymentDTO,
  createMetricsOutDTO,
  insertAppAndUser,
  insertMetrics,
  clearTables
} from "./test_utils";
let sinon = require("sinon");

const HOUR_MS = 3600 * 1000;
const deploymentKey = "ABCDEF12345";
const deploymentKey2 = "AAAAAA67890";
const deploymentKey3 = "FFFFF4321";
const deployments = [
  createDeploymentDTO(1, deploymentKey, "Deploy 1", { label: "1.0.0" }, []),
  createDeploymentDTO(2, deploymentKey2, "Deploy 2", {}, []),
  createDeploymentDTO(3, deploymentKey3, "Deploy 3", {}, [])
];

const incomingMetrics = [
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "Downloaded", 5),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentSucceeded", 4),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentFailed", 3)
];

const unorderedMetrics = [
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "Downloaded", 12, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentSucceeded", 7, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentFailed", 2, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v0", "0.9.0", "Downloaded", 2)
];

const metricsWithPreviousVersion = [
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "Downloaded", 5, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentSucceeded", 2, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentFailed", 3, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "0.9.5", "Downloaded", 1, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "0.9.5", "DeploymentSucceeded", 1, "0.9.0")
];
const metricsWithNegativeSummary = [
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "Downloaded", 100, "0.9.0"),
  createMetricsOutDTO(deploymentKey, "v1", "1.0.0", "DeploymentSucceeded", 100, "0.9.0")
];

describe("summarizor tests", function() {
  this.timeout(10000);
  let sandbox: any;
  let summarizer: any;
  let logger: any;
  let dao: any;
  let options: any;
  let clock: any;
  let currentSummary: MetricSummaryDTO;
  const lastRunTimeUTC: any = new Date(Date.now());
  const last2HourUTC: any = new Date(Date.now() - 2 * 3600);

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = {
      info: sandbox.stub(),
      error: sandbox.stub()
    };
    dao = {
      getDeployments: sandbox.stub(),
      metricsByStatusAndTime: sandbox.stub(),
      getMetricSummary: sandbox.stub(),
      acquireMetricLock: sandbox.stub(),
      releaseMetricLock: sandbox.stub()
    };
    options = {
      sleepSec: 0.3,
      summationRangeInHours: 2,
      lockExpirationInHours: 2
    };
    summarizer = new Summarizor(options, dao, logger);
    clock = sandbox.useFakeTimers(Date.now());

    currentSummary = new MetricSummaryDTO();
    currentSummary.summaryJson = JSON.stringify({});
    currentSummary.lastRunTimeUTC = lastRunTimeUTC;
  });

  afterEach(() => {
    if (logger.error.callCount > 0) {
      console.error(logger.error.getCall(0).args);
      expect.fail();
    }
    summarizer.stop();
    sandbox.restore();
  });

  it("test start and stop", done => {
    dao.getDeployments.resolves(deployments);
    summarizer
      .start()
      .then(() => {
        expect(summarizer.isStopped).true;
        expect(logger.info.callCount).eq(2);
        expect(logger.info.getCall(1).args[0]).eq(`[service-worker]`);
        expect(logger.info.getCall(1).args[1]).eq(`Stopped`);
      })
      .then(done, done);
    expect(summarizer.isStopped).false;
    expect(logger.info.callCount).eq(1);
    expect(logger.info.getCall(0).args[0]).eq(`[service-worker]`);
    expect(logger.info.getCall(0).args[1]).eq(`Starting`);
    summarizer.stop();
  });

  it("test stop clears sleep timer", async () => {
    options.sleepSec = 60;

    dao.getDeployments.resolves([]);
    Promise.all([
      summarizer.start(),
      () => {
        clock.tick(1000);
        return summarizer.stop();
      }
    ]);
  });

  it("summarize with no new metrics", () => {
    dao.metricsByStatusAndTime.resolves([]);
    return summarizer
      .test_summarize(deployments[0], currentSummary, last2HourUTC, lastRunTimeUTC)
      .then((newSummary: any) => {
        expect(dao.metricsByStatusAndTime.callCount).eq(1);
        expect(dao.metricsByStatusAndTime.getCall(0).args[0]).eq(deployments[0].key);
        expect(dao.metricsByStatusAndTime.getCall(0).args[1]).eq(last2HourUTC);
        expect(dao.metricsByStatusAndTime.getCall(0).args[2]).eq(lastRunTimeUTC);
        expect(newSummary.summaryJson).eq(JSON.stringify({}));
        expect(newSummary.lastRunTimeUTC).eq(lastRunTimeUTC);
      });
  });

  it("summarize generates summary", () => {
    dao.metricsByStatusAndTime.resolves(incomingMetrics);
    const expected = {
      "1.0.0": {
        active: 4,
        downloaded: 5,
        installed: 4,
        failed: 3
      }
    };
    return summarizer
      .test_summarize(deployments[0], currentSummary, last2HourUTC, lastRunTimeUTC)
      .then((newSummary: any) => {
        const result = JSON.parse(newSummary.summaryJson);
        expect(result["1.0.0"]).deep.eq(expected["1.0.0"]);
      });
  });

  it("summarize sums with existing summary", () => {
    dao.metricsByStatusAndTime.resolves(incomingMetrics);
    const existingSummary = {
      "1.0.0": {
        active: 100,
        downloaded: 200,
        installed: 300,
        failed: 400
      }
    };
    const expected = {
      "1.0.0": {
        active: 104,
        downloaded: 205,
        installed: 304,
        failed: 403
      }
    };
    currentSummary.summaryJson = JSON.stringify(existingSummary);
    return summarizer
      .test_summarize(deployments[0], currentSummary, last2HourUTC, lastRunTimeUTC)
      .then((newSummary: any) => {
        const result = JSON.parse(newSummary.summaryJson);
        expect(result["1.0.0"]).deep.eq(expected["1.0.0"]);
      });
  });

  it("summarize decrements active count from previous version", () => {
    dao.metricsByStatusAndTime.resolves(metricsWithPreviousVersion);
    const existingSummary = {
      "0.9.0": {
        active: 10,
        downloaded: 15,
        installed: 10,
        failed: 5
      }
    };
    currentSummary.summaryJson = JSON.stringify(existingSummary);
    const expected = {
      "0.9.0": {
        active: 7,
        downloaded: 15,
        installed: 10,
        failed: 5
      },
      "0.9.5": {
        active: 1,
        downloaded: 1,
        installed: 1,
        failed: 0
      },
      "1.0.0": {
        active: 2,
        downloaded: 5,
        installed: 2,
        failed: 3
      }
    };

    return summarizer
      .test_summarize(deployments[0], currentSummary, last2HourUTC, lastRunTimeUTC)
      .then((newSummary: any) => {
        const result = JSON.parse(newSummary.summaryJson);
        expect(result["0.9.0"]).deep.eq(expected["0.9.0"]);
        expect(result["0.9.5"]).deep.eq(expected["0.9.5"]);
        expect(result["1.0.0"]).deep.eq(expected["1.0.0"]);
      });
  });

  it("summarize does not decrement below 0 active", () => {
    dao.metricsByStatusAndTime.resolves(metricsWithNegativeSummary);
    const existingSummary = {
      "0.9.0": {
        active: 1,
        downloaded: 1,
        installed: 1,
        failed: 0
      }
    };
    currentSummary.summaryJson = JSON.stringify(existingSummary);

    const expected = {
      "0.9.0": {
        active: 0,
        downloaded: 1,
        installed: 1,
        failed: 0
      }
    };
    return summarizer
      .test_summarize(deployments[0], currentSummary, last2HourUTC, lastRunTimeUTC)
      .then((newSummary: any) => {
        const result = JSON.parse(newSummary.summaryJson);
        expect(result["0.9.0"]).deep.eq(expected["0.9.0"]);
      });
  });

  it("test doWork does not work if no deployment", () => {
    dao.getDeployments.resolves([]);
    return summarizer.test_run_loop().then((didWork: boolean) => {
      expect(didWork).false;
      return summarizer.stop();
    });
  });

  it("test doWork starts summarizing at 2019/01/01", () => {
    const startDate = new Date(Date.UTC(2019, 1, 1));
    dao.getDeployments.resolves(deployments);
    currentSummary.lastRunTimeUTC = new Date(0);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves([]);
    return summarizer.test_run_loop().then(() => {
      expect(dao.metricsByStatusAndTime.callCount).eq(1);
      expect(dao.metricsByStatusAndTime.getCall(0).args[0]).eq(deployments[0].key);
      expect(dao.metricsByStatusAndTime.getCall(0).args[2].getTime()).eq(startDate.getTime());
    });
  });

  it("test acquiresLock with configuration expiration hours from now", () => {
    const lockExpireUTC: Date = new Date(Date.now() + options.lockExpirationInHours * HOUR_MS);
    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves([]);

    return summarizer.test_run_loop().then(() => {
      expect(dao.acquireMetricLock.callCount).eq(1);
      expect(dao.acquireMetricLock.getCall(0).args[0]).eq(deployments[0].key);
      expect(dao.acquireMetricLock.getCall(0).args[2].getTime()).eq(lockExpireUTC.getTime());
    });
  });

  it("test doWork releaseLock", () => {
    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves([]);
    dao.releaseMetricLock.resolves();

    return summarizer.test_run_loop().then(() => {
      expect(dao.releaseMetricLock.callCount).eq(1);
      const newSummary = dao.releaseMetricLock.getCall(0).args[0];
      expect(JSON.parse(newSummary.summaryJson)).deep.eq({});
      expect(summarizer.timeout).not.undefined;
    });
  });

  it("test doWork summarizes and saves summary", () => {
    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves(incomingMetrics);
    dao.releaseMetricLock.resolves();
    const expected = {
      "1.0.0": {
        active: 4,
        downloaded: 5,
        installed: 4,
        failed: 3
      }
    };

    return summarizer.test_run_loop().then(() => {
      expect(dao.acquireMetricLock.getCall(0).args[0]).eq(deployments[0].key);
      expect(dao.releaseMetricLock.callCount).eq(1);
      const newSummary = dao.releaseMetricLock.getCall(0).args[0];
      expect(JSON.parse(newSummary.summaryJson)).deep.eq(expected);
    });
  });

  it("test summarizes in configurable time range", () => {
    const lastRuntime = new Date(Date.UTC(2019, 2, 8, 4, 44, 44));
    currentSummary.lastRunTimeUTC = lastRuntime;
    const expectedRange = new Date(
      Date.UTC(2019, 2, 8, 4, 0, 0) + options.summationRangeInHours * HOUR_MS
    );

    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves(incomingMetrics);
    dao.releaseMetricLock.resolves();
    return summarizer.test_run_loop().then(() => {
      expect(dao.metricsByStatusAndTime.callCount).eq(1);
      expect(dao.metricsByStatusAndTime.getCall(0).args[1]).eq(lastRuntime);
      expect(dao.metricsByStatusAndTime.getCall(0).args[2].getTime()).eq(expectedRange.getTime());
    });
  });

  it("test summarizes in configuration time range upto now", () => {
    const oneHourAgo = new Date(Date.now() - HOUR_MS);
    currentSummary.lastRunTimeUTC = oneHourAgo;
    const expectedRange = new Date(Date.now());
    expectedRange.setMinutes(0, 0, 0);

    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves(incomingMetrics);
    dao.releaseMetricLock.resolves();
    return summarizer.test_run_loop().then(() => {
      expect(dao.metricsByStatusAndTime.callCount).eq(1);
      expect(dao.metricsByStatusAndTime.getCall(0).args[1]).eq(oneHourAgo);
      expect(dao.metricsByStatusAndTime.getCall(0).args[2].getTime()).eq(expectedRange.getTime());
    });
  });

  it("test summarize unordered metrics", () => {
    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves(unorderedMetrics);
    dao.releaseMetricLock.resolves();
    const expected = {
      "0.9.0": {
        active: 0,
        downloaded: 2,
        installed: 0,
        failed: 0
      },
      "1.0.0": {
        active: 7,
        downloaded: 12,
        installed: 7,
        failed: 2
      }
    };
    return summarizer.test_run_loop().then(() => {
      expect(dao.acquireMetricLock.getCall(0).args[0]).eq(deployments[0].key);
      expect(dao.releaseMetricLock.callCount).eq(1);
      const newSummary = dao.releaseMetricLock.getCall(0).args[0];
      expect(JSON.parse(newSummary.summaryJson)).deep.eq(expected);
    });
  });

  it("test doWork sleeps between work", () => {
    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves(incomingMetrics);
    let deploymentIdxCount = 0;
    dao.releaseMetricLock.callsFake(() => {
      deploymentIdxCount++;
      if (deploymentIdxCount === deployments.length) {
        summarizer.stop();
      }
    });
    const sleepStub = sandbox.stub(summarizer, "sleep");
    sleepStub.resolves();

    return summarizer.start().then(() => {
      expect(sleepStub.callCount).eq(deployments.length - 1);
      expect(sleepStub.getCall(0).args[0]).eq(options.sleepSec * 1000);
    });
  });

  it("test exception in doWork logs to logger", async () => {
    await summarizer.test_run_loop();
    expect(logger.error.callCount).eq(1);
    expect(logger.error.getCall(0).args[0]).eq("[service-worker]");
    expect(logger.error.getCall(0).args[1]).contains(
      "Error summarizing deployment [no deployment]"
    );
    logger.error.reset();
  });

  it("test summarizer logs info", async () => {
    dao.getDeployments.resolves(deployments);
    dao.acquireMetricLock.resolves(currentSummary);
    dao.metricsByStatusAndTime.resolves([]);
    options = {
      sleepSec: 0.3,
      summationRangeInHours: 2,
      lockExpirationInHours: 2,
      logging: LOGGING_INFO
    };
    summarizer = new Summarizor(options, dao, logger);
    await summarizer.test_run_loop();

    expect(logger.info.callCount).eq(3);
    expect(logger.info.getCall(0).args[1]).eq(`Summarize start: key=${deployments[0].key} new-metrics=0 current={}`);
    expect(logger.info.getCall(1).args[1]).eq(`Summarize complete: key=${deployments[0].key} new={}`);
    expect(logger.info.getCall(2).args[1]).match(/^Summarize timestamp: key=(.*) lastRun=(.*)$/);
  });
});

describe("summarizor with database", function() {
  this.timeout(10000);
  let logger: any;
  let dao: any;
  let sandbox: any;
  let options: any;
  let summarizer: any;
  const STAGING = "Staging";
  const stageDeploymentKey = "qjPVRyntQQrKJhkkNbVJeULhAIfVtHaBDfCFggzL";
  const appName = "testApp";
  const appOwner = "test@testApp.com";
  const serverConfigs = require(resolve(__dirname, "config", "default.json"));

  const unsummarizedMetrics = [
    createMetricsInDTO(stageDeploymentKey, "v1", "1.0.0", "Downloaded"),
    createMetricsInDTO(stageDeploymentKey, "v1", "1.0.0", "DeploymentSucceeded"),
    createMetricsInDTO(stageDeploymentKey, "v1", "1.0.0", "DeploymentFailed"),
    createMetricsInDTO(stageDeploymentKey, "v1", "1.0.0", "Downloaded")
  ];

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = {
      info: sandbox.stub(),
      error: sandbox.stub()
    };
    options = {
      sleepSec: 0.3,
      summationRangeInHours: (Date.now() - Date.UTC(2019, 1, 1, 0, 0, 0)) % HOUR_MS,
      lockExpirationInHours: 2
    };
    return daoFactory(serverConfigs, logger).then((db: any) => {
      dao = db;
      summarizer = new Summarizor(options, dao, logger);
      return dao.getConnection().then((connection: any) => {
        clearTables(connection);
        connection.release();
      });
    });
  });

  afterEach(() => {
    expect(logger.error.callCount).eq(0);
    summarizer.stop();
    shutdown();
    sandbox.restore();
  });

  it("summarize a deployment", () => {
    const userDTO = createUserDTO(appOwner, "Owner", {});
    const deployments = {
      STAGING: {
        key: stageDeploymentKey,
        name: STAGING
      }
    };
    const collaborators = { [appOwner]: { permission: "Owner" } };
    const appDTO = createAppDTO(appName, collaborators, deployments);

    return insertAppAndUser(dao, userDTO, appDTO)
      .then(() => insertMetrics(dao, unsummarizedMetrics))
      .then(() => dao.getMetricSummary(stageDeploymentKey))
      .then((summary: any) => {
        expect(summary).undefined;
        const summationPeriod = new Date(Date.now());
        sandbox.stub(summarizer, "_getSummationEndPeriod").returns(summationPeriod);
        return summarizer.test_run_loop();
      })
      .then(() => dao.getMetricSummary(stageDeploymentKey))
      .then((summary: any) => {
        const expected = {
          "1.0.0": {
            active: 1,
            downloaded: 2,
            installed: 1,
            failed: 1
          }
        };
        expect(summary).not.undefined;
        expect(summary.lockBy).null;
        expect(summary.lockTimeUTC).null;
        expect(summary.summaryJson).eq(JSON.stringify(expected));
      });
  });
});
