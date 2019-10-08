"use strict";
import { fork, execFile } from "child_process";
import { join, resolve } from "path";
import { expect } from "chai";
import {
  createUserDTO,
  createAppDTO,
  createMetricsInDTO,
  insertAppAndUser,
  insertMetrics,
  modifyMetricsCreateTime,
  clearTables
} from "./test_utils";
import { daoFactory, shutdown } from "../src/dao_factory";
let sinon = require("sinon");

describe("test service worker", function() {
  this.timeout(10000);
  const appOwnerEmail = "owner@walmart.com";
  const appName = "Super App";
  const stageDeploymentKey = "MVM6OcJsG/XZ7Ir2cJQHK02Q9pidMY3q0GFfWE+gTy8=";
  const serviceWorkerFile = join(__dirname, "../src/service_worker");
  const configDir = resolve(__dirname, "config");
  const serverConfigs = require(resolve(configDir, "default.json"));
  let sandbox: any;
  let logger: any;
  let pids: any[] = [];
  let handle: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = {
      info: sandbox.stub(),
      error: sandbox.stub()
    };
  });
  afterEach(async () => {
    sandbox.restore();
  });

  after(done => {
    shutdown();
    return execFile("ps", ["-p", pids.join(",")], (err: Error, stdout: string, stderr: string) => {
      const procs = stdout.split("\n").filter(x => x.indexOf("service-worker") >= 0);
      procs.forEach(p => {
        const tokens = p.split(`\t`);
        process.kill(parseInt(tokens[0]));
      });
      done();
    });
  });

  const startServiceWorker = (logging:string): Promise<any> => {
    const args: string[] = ["--sleep=1", `--query_range=24`, `--logging=${logging}`];
    handle = fork(serviceWorkerFile, args, {
      env: { OTA_CONFIG_DIR: configDir },
      execArgv: ["-r", "ts-node/register"],
      stdio: "pipe"
    });
    pids.push(handle.pid);
    return new Promise((resolve, reject) => {
      handle.stdout!.once("data", (data: Buffer | string) => {
        resolve(handle);
      });
      handle.once("error", (err: any) => {
        reject(handle);
      });
    });
  };

  const ensureProcessExit = (h: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      h.on("exit", (code: number, signal: string) => {
        expect(code).not.eq(1);
        resolve();
      });
    });
  };

  const createDao = async (): Promise<any> => {
    let dao = await daoFactory(serverConfigs, logger);
    const connection: any = await dao.getConnection();
    await clearTables(connection);
    return dao;
  };

  const insertMetricsToDatabase = async (dao: any): Promise<any> => {
    const userDTO = createUserDTO(appOwnerEmail, "Owner", {});
    const collabs = {
      [appOwnerEmail]: { permission: "Owner" }
    };
    const deployments = {
      Staging: {
        key: stageDeploymentKey,
        name: "Staging"
      }
    };
    const appDTO = createAppDTO(appName, collabs, deployments);
    const unsummarizedMetrics = [
      createMetricsInDTO(stageDeploymentKey, "v7", "1.7.0", "Downloaded"),
      createMetricsInDTO(stageDeploymentKey, "v7", "1.7.0", "DeploymentSucceeded"),
      createMetricsInDTO(stageDeploymentKey, "v7", "1.7.0", "DeploymentSucceeded"),
      createMetricsInDTO(stageDeploymentKey, "v7", "1.7.0", "Downloaded"),
      createMetricsInDTO(stageDeploymentKey, "v7", "1.7.0", "DeploymentFailed")
    ];

    await insertAppAndUser(dao, userDTO, appDTO);
    await insertMetrics(dao, unsummarizedMetrics);
    await modifyMetricsCreateTime(
      dao,
      stageDeploymentKey,
      new Date(Date.UTC(2019, 1, 1, 12, 0, 0))
    );
    const summary: any = await dao.getMetricSummary(stageDeploymentKey);
    expect(summary).undefined;
  };

  it("starts and stops", async () => {
    handle = await startServiceWorker("debug");
    const exitP = ensureProcessExit(handle);
    handle.kill("SIGINT");
    await exitP;
  });

  it("starts and summarizes", async () => {
    let dao = await createDao();
    await insertMetricsToDatabase(dao);

    handle = await startServiceWorker("info");
    // Poll 5 seconds
    let summary: any;
    for (let i = 0; i < 10; i++) {
      summary = await dao.getMetricSummary(stageDeploymentKey);
      if (summary && summary.summaryJson !== "{}") break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    const exitP = ensureProcessExit(handle);
    handle.kill("SIGINT");

    expect(summary).not.undefined;
    const summaryJson = JSON.parse(summary.summaryJson);
    expect(summaryJson["1.7.0"]).deep.eq({
      downloaded: 2,
      active: 2,
      failed: 1,
      installed: 2
    });
    await exitP;
  });
});
