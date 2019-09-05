"use strict";
import { expect } from "chai";
import ElectrodeOtaDaoRdbms from "../src/ElectrodeOtaDaoRdbms";
import MetricSummaryDAO from "../src/dao/MetricSummaryDAO";
import { clearTables, clearMetricsSummary } from "./ClearTables";
import { AppDTO, MetricSummaryDTO, UserDTO } from "../src/dto";
let { createSandbox } = require("sinon");

// tslint:disable:no-console

const EXPIRE_TIME = 2 * 60 * 60 * 1000;
const LAST_RUN = 2 * 60 * 60 * 1000;

const dao = new ElectrodeOtaDaoRdbms();
const testDBConfig = {
  clusterConfig: {
    canRetry: true,
    defaultSelector: "ORDER",
    removeNodeErrorCount: 5,
    restoreNodeTimeout: 0
  },
  poolConfigs: [
    {
      database: "electrode_ota",
      host: "localhost",
      password: "ota",
      port: 33060,
      user: "ota"
    }
  ],
  encryptionConfig: {
    keyfile: "./test/sample_encryption.key",
    fields: [
      "user.name",
      "user.email",
      "package.released_by",
      "access_key.friendly_name",
      "access_key.description"
    ]
  }
};
const STAGING = "Staging";
const stageDeploymentKey = "qjPVRyntQQrKJhkkNbVJeULhAIfVtHaBDfCFggzL";
const ONE_HOUR = 60 * 60 * 1000;
const TWO_HOURS = 2 * ONE_HOUR;

describe("MetricSummaryDAO", function() {
  this.timeout(15000);
  let appId: number;
  let stageDeploymentId: number;
  let sandbox: any;
  const lockExpire = new Date(Date.now() + EXPIRE_TIME);

  const userDTO = new UserDTO();
  userDTO.email = "bingo@walmart.com";
  userDTO.name = "bingo";
  userDTO.accessKeys = {
    abcdefg: {
      name: "abcdefg",
      friendlyName: "Login-abcdefg",
      expires: Date.now() + 60 * 24 * 3600 * 1000,
      id: "blah",
      email: userDTO.email
    }
  };
  const appDTO = new AppDTO();
  appDTO.name = "bingo";
  appDTO.collaborators = { [userDTO.email]: { permission: "Owner" } };
  appDTO.deployments = {
    [STAGING]: {
      key: stageDeploymentKey,
      name: STAGING
    }
  };

  function createObjects() {
    return dao
      .createUser(userDTO)
      .then(() => dao.createApp(appDTO))
      .then(app => {
        appId = app.id;
        return dao.deploymentForKey(stageDeploymentKey);
      })
      .then(deployment => {
        stageDeploymentId = deployment!.id;
      });
  }
  function assertDatabaseValues(connection: any, summaryId: number, values: any): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM metrics_summary where id=?`,
        [summaryId],
        (err: any, results: any) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    }).then((results: any) => {
      expect(results.length).eq(1);
      Object.keys(values).forEach((key: any) => {
        expect(results[0][key]).eq(values[key]);
      });
      return;
    });
  }

  before(() => {
    return dao
      .connect(testDBConfig)
      .then(() =>
        dao.getConnection().then(async connection => {
          await clearTables(connection);
          connection.release();
        })
      )
      .then(() => createObjects());
  });

  after(() => {
    return dao.close();
  });

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    return dao.getConnection().then(async connection => {
      await clearMetricsSummary(connection);
      connection.release();
    });
  });

  it("test acquire metric with unknown deployment key", () => {
    return dao
      .acquireMetricLock("abc", "host1", lockExpire)
      .then(() => {
        throw new Error("Expecting exception to be thrown");
      })
      .catch(err => {
        expect(err).not.undefined;
        expect(err.toString()).eq("Error: Not found. no deployment found for key [abc]");
      });
  });

  it("test acquire metric lock with valid deployment key", () => {
    return dao.acquireMetricLock(stageDeploymentKey, "host1", lockExpire).then(summary => {
      expect(summary).not.undefined;
      expect(summary!.lockBy).eq("host1");
      expect(summary!.lockTimeUTC).greaterThan(new Date(Date.now()));
      expect(summary!.summaryJson).eq("{}");
    });
  });

  it("test acquire metric lock twice fails", () => {
    return dao
      .acquireMetricLock(stageDeploymentKey, "host1", lockExpire)
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.lockBy).eq("host1");
      })
      .then(() => dao.acquireMetricLock(stageDeploymentKey, "host2", lockExpire))
      .then(summary => {
        expect(summary).is.undefined;
      });
  });

  it("test acquire lock from expired lock succeeds", () => {
    // create lock that expires immediately
    const lockExpireNow = new Date(Date.now() - 1);
    return dao
      .acquireMetricLock(stageDeploymentKey, "host1", lockExpireNow)
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.lockBy).eq("host1");
      })
      .then(() => dao.acquireMetricLock(stageDeploymentKey, "host2", lockExpire))
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.lockBy).eq("host2");
      });
  });

  it("test acquire lock and release lock", () => {
    let firstLock: MetricSummaryDTO;
    let conn;
    return dao.getConnection().then(connection => {
      return dao
        .acquireMetricLock(stageDeploymentKey, "host1", lockExpire)
        .then(summary => {
          expect(summary).not.undefined;
          expect(summary!.lockBy).eq("host1");
          firstLock = summary!;
          return assertDatabaseValues(connection, summary!.id!, { lock_by: "host1" });
        })
        .then(() => dao.releaseMetricLock(firstLock))
        .then(() => {
          assertDatabaseValues(connection, firstLock!.id!, { lock_time: null, lock_by: null });
          connection.release();
        });
    });
  });

  it("test acquire lock, release lock, acquire lock", () => {
    return dao
      .acquireMetricLock(stageDeploymentKey, "host1", lockExpire)
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.lockBy).eq("host1");
        return dao.releaseMetricLock(summary!);
      })
      .then(() => dao.acquireMetricLock(stageDeploymentKey, "host2", lockExpire))
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.lockBy).eq("host2");
      });
  });

  it("test acquire lock rollback on error", () => {
    let updateFunc = sandbox.stub(MetricSummaryDAO, "addOrUpdateMetricSummary");
    let rollbackFunc = sandbox.spy(MetricSummaryDAO, "rollback");
    updateFunc.throws(new Error("addOrUpdate failed in some way"));
    return dao.acquireMetricLock(stageDeploymentKey, "blitz", lockExpire)
      .then(() => {
        throw new Error("Exception expected");
      }).catch((err) => {
        expect(err).not.undefined;
        expect(err.toString()).eq("Error: addOrUpdate failed in some way");
        expect(rollbackFunc.called).true;
      });
  });

  it("test summary is required", () => {
    const twoHoursAgoUTC = new Date(Date.now() - TWO_HOURS);
    return dao.isSummaryRequired(stageDeploymentKey, twoHoursAgoUTC).then(result => {
      expect(result).true;
    });
  });

  it("test summary not required if it is locked", () => {
    const twoHoursAgoUTC = new Date(Date.now() - TWO_HOURS);
    return dao
      .acquireMetricLock(stageDeploymentKey, "host1", lockExpire)
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.lockBy).eq("host1");
        return dao.isSummaryRequired(stageDeploymentKey, twoHoursAgoUTC);
      })
      .then(result => {
        expect(result).false;
      });
  });

  it("test summary not required if summarized within two hours ago", () => {
    const twoHoursAgoUTC = new Date(Date.now() - TWO_HOURS);
    const summaryDTO = new MetricSummaryDTO();
    summaryDTO.deploymentId = stageDeploymentId!;
    summaryDTO.lastRunTime = new Date(Date.now() - ONE_HOUR);
    return dao
      .addOrUpdateMetricSummary(summaryDTO)
      .then(summary => dao.isSummaryRequired(stageDeploymentKey, twoHoursAgoUTC))
      .then(result => {
        expect(result).false;
      });
  });

  it("test summary required if summarized past two hours ago", () => {
    const twoHoursAgoUTC = new Date(Date.now() - TWO_HOURS);
    const summaryDTO = new MetricSummaryDTO();
    summaryDTO.deploymentId = stageDeploymentId!;
    summaryDTO.lastRunTime = new Date(Date.now() - TWO_HOURS - 10);
    return dao
      .addOrUpdateMetricSummary(summaryDTO)
      .then(summary => dao.isSummaryRequired(stageDeploymentKey, twoHoursAgoUTC))
      .then(result => {
        expect(result).true;
      });
  });

  it("test get metric summary of unknown deploy", () => {
    return dao
      .getMetricSummary("abcd")
      .then(() => {
        throw new Error("Exception expected");
      })
      .catch(err => {
        expect(err).not.undefined;
        expect(err.toString()).eq("Error: Not found. no deployment found for key [abcd]");
      });
  });

  it("test get metric summary for valid deployment key", () => {
    return dao.getMetricSummary(stageDeploymentKey).then(summary => {
      expect(summary).undefined;
    });
  });

  it("test get metric summary of locked summary", () => {
    let acquireSummary;
    return dao
      .acquireMetricLock(stageDeploymentKey, "pango", lockExpire)
      .then(summary => {
        acquireSummary = summary;
        return dao.getMetricSummary(stageDeploymentKey);
      })
      .then(summary => {
        expect(summary!.deploymentId).eq(stageDeploymentId!);
        expect(summary!.lockBy!).eq("pango");
        expect(summary!.summaryJson).eq("{}");
        expect(JSON.parse(summary!.summaryJson)).deep.eq({});
      });
  });

  it("test add metric summary", () => {
    const summaryToAdd = new MetricSummaryDTO();
    summaryToAdd.deploymentId = stageDeploymentId!;
    summaryToAdd.lastRunTime = new Date(Date.now() - ONE_HOUR);
    summaryToAdd.summaryJson = '{"pango":"pongo"}';
    return dao
      .getMetricSummary(stageDeploymentKey)
      .then(summary => {
        expect(summary).undefined;
        return dao.addOrUpdateMetricSummary(summaryToAdd);
      })
      .then(() => dao.getMetricSummary(stageDeploymentKey))
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.id!).not.undefined;
        expect(summary!.deploymentId!).eq(summaryToAdd.deploymentId);
        expect(summary!.lastRunTime.getTime()).eq(summaryToAdd.lastRunTime.getTime());
        expect(summary!.summaryJson).eq(summaryToAdd.summaryJson);
      });
  });

  it("test update metric summary", () => {
    const summaryToAdd = new MetricSummaryDTO();
    summaryToAdd.deploymentId = stageDeploymentId!;
    summaryToAdd.lastRunTime = new Date(Date.now() - ONE_HOUR);
    summaryToAdd.summaryJson = '{"pango":"pongo"}';
    return dao
      .getMetricSummary(stageDeploymentKey)
      .then(summary => {
        expect(summary).undefined;
        return dao.addOrUpdateMetricSummary(summaryToAdd);
      })
      .then(() => dao.getMetricSummary(stageDeploymentKey))
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.deploymentId).eq(summaryToAdd.deploymentId);
        expect(summary!.summaryJson).eq(summaryToAdd.summaryJson);
        summary!.summaryJson = '{"pango": "bongo", "pan": "delche"}';
        return dao.addOrUpdateMetricSummary(summary!);
      })
      .then(() => dao.getMetricSummary(stageDeploymentKey))
      .then(summary => {
        expect(summary).not.undefined;
        expect(summary!.deploymentId).eq(summaryToAdd.deploymentId);
        expect(summary!.summaryJson).eq('{"pango": "bongo", "pan": "delche"}');
      });
  });
});
