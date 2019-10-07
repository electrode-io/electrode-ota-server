"use strict";
import { expect } from "chai";
import { createDeploymentDTO, createMetricSummaryDTO } from "./test_utils";
import DeploymentCache from "../src/deployment_cache";
let sinon = require("sinon");

const ONE_MINUTE = 60 * 1000;
const THIRTY_MINUTES = 30 * ONE_MINUTE;
let deployments = [
  createDeploymentDTO(1, "UH3nTWPWRY5u6O", "Cache Deploy 1", { label: "1.0.0" }, []),
  createDeploymentDTO(2, "HAOs6NTKUUjW", "Cache Deploy 2", {}, []),
  createDeploymentDTO(3, "20vRHuKUI1lw8k", "Cache Deploy 3", {}, [])
];
let summaries = [
  createMetricSummaryDTO(
    1,
    new Date(Date.UTC(2019, 1, 1)),
    JSON.stringify({}),
    undefined,
    undefined
  ),
  createMetricSummaryDTO(
    2,
    new Date(Date.UTC(2019, 1, 1)),
    JSON.stringify({}),
    undefined,
    undefined
  ),
  createMetricSummaryDTO(
    3,
    new Date(Date.UTC(2019, 1, 1)),
    JSON.stringify({}),
    undefined,
    undefined
  )
];

describe("test deployment cache", function() {
  this.timeout(10000);
  let sandbox: any;
  let dao: any;
  let clock: any;
  let cache: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    dao = {
      getDeployments: sandbox.stub(),
      getMetricSummary: sandbox.stub()
    };
    clock = sandbox.useFakeTimers(Date.now());
    cache = new DeploymentCache(dao);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const initializeDao = () => {
    dao.getDeployments.resolves(deployments);
    for (let i = 0; i < deployments.length; i++) {
      dao.getMetricSummary.withArgs(deployments[i].key).resolves(summaries[i]);
    }
  };

  it("call next refreshes cache for first time", async () => {
    initializeDao();

    const deploy = await cache.next();
    expect(deploy.key).eq(deployments[0].key);
    expect(cache.deployments.length).eq(3);
    expect(cache.nextIdx).eq(1);
  });

  it("call next loops to beginning", async () => {
    initializeDao();

    cache.nextIdx = deployments.length;
    let deploy = await cache.next();
    expect(deploy.key).eq(deployments[0].key);
    deploy = await cache.next();
    expect(deploy.key).eq(deployments[1].key);
    deploy = await cache.next();
    expect(deploy.key).eq(deployments[2].key);
    deploy = await cache.next();
    expect(deploy.key).eq(deployments[0].key);
  });

  it("call next skips if last run time is within an hour", async () => {
    summaries[1].lastRunTimeUTC = new Date(Date.now() - THIRTY_MINUTES);
    initializeDao();

    let deploy = await cache.next();
    expect(deploy.key).eq(deployments[0].key);
    deploy = await cache.next();
    expect(deploy.key).eq(deployments[2].key);
  });

  it("call next skips if all have last run time within an hour", async() => {
    summaries.forEach(summary => {
      summary.lastRunTimeUTC = new Date(Date.now() - THIRTY_MINUTES);
    });
    initializeDao();

    let deploy = await cache.next();
    expect(deploy).eq(false);
    deploy = await cache.next();
    expect(deploy).eq(false);
  });

  it("call next skips locked summary until lock expiration", async () => {
    summaries[0].lockTimeUTC = new Date(Date.now() + THIRTY_MINUTES);
    summaries[1].lastRunTimeUTC = new Date(Date.now());
    summaries[2].lastRunTimeUTC = new Date(Date.now());
    initializeDao();

    let deploy = await cache.next();
    expect(deploy).eq(false);
    // call again returns same result
    deploy = await cache.next();
    expect(deploy).eq(false);
    clock.tick(THIRTY_MINUTES + ONE_MINUTE);
    deploy = await cache.next();
    expect(deploy.key).eq(deployments[0].key);
  });

  it("call next use deployment if no summary exists", async () => {
    summaries = [];
    initializeDao();
    
    let deploy = await cache.next();
    expect(deploy.key).eq(deployments[0].key);
  });

  it("call next returns false if no deployments", async () => {
    deployments = []
    initializeDao();

    let deploy = await cache.next();
    expect(deploy).eq(false);
  });

  it("deployment list expires", async () => {
    initializeDao();

    let deploy = await cache.next();
    expect(deploy.key).eq(deployments[0]);
    expect(dao.getDeployments.callCount).eq(1);

    clock.tick(4*THIRTY_MINUTES + ONE_MINUTE);

    deploy = await cache.next();
    expect(deploy.key).eq(deployments[0]);
    expect(dao.getDeployments.callCount).eq(2);
  })
});
