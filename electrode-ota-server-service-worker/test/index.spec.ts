"use strict";

import ServiceManager from "../src/service_manager";
import { factory, test_inject_svc, test_get_svc } from "../src/index";
import { expect } from "chai";
let sinon = require("sinon");

describe("index tests", () => {
  let sandbox: any;
  let logger: any;
  let svc: any;

  before(() => {
    svc = new ServiceManager();
    test_inject_svc(svc);
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = {
      info: (msg: string) => {},
      error: (msg: string) => {}
    };
  });

  afterEach(done => {
    svc.on("manager", (state: string) => {
      if (state === "stopped") {
        svc.removeAllListeners("manager");
        sandbox.restore();
        done();
      }
    });
    svc.stop();
    svc.removeAllListeners("child");
  });

  it("index should start workers", done => {
    let options = {};
    svc.on("child", (state: string, child: any) => {
      if (state === "starting") {
        expect(svc.runningWorkers()).eq(1);
        done();
      }
    });
    factory(options, logger);
  });

  it("index starts configurable number of workers", done => {
    let options = {
      numberWorkers: 3
    };
    svc.on("child", (state: string, child: any) => {
      if (state === "starting") {
        if (svc.runningWorkers() === 3) {
          done();
        }
      }
    });
    factory(options, logger);
  });

  it("index creates ServiceManager", () => {
    test_inject_svc(undefined);

    factory({}, logger);

    svc = test_get_svc();
    expect(svc).not.undefined;
  });
});
