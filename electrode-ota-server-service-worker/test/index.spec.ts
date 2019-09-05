"use strict";

import { createSandbox } from "sinon";
import ServiceManager from "../src/service_manager";
import { factory } from "../src/index";
import { expect } from "chai";

describe("index tests", () => {
  let sandbox: any;
  let logger: any;

  beforeEach(() => {
    sandbox = createSandbox();
    logger = {
      info: sandbox.spy(),
      error: sandbox.spy()
    };
  });

  afterEach(done => {
    ServiceManager.instance.on("manager", (state: string) => {
      if (state === "stopped") {
        ServiceManager.instance.removeAllListeners("manager");
        done();
      }
    });
    ServiceManager.instance.stop();
    ServiceManager.instance.removeAllListeners("child");
    sandbox.restore();
  });

  it("index should start workers", done => {
    let options = {};
    ServiceManager.instance.on("child", (state: string, child: any) => {
      if (state === "running") {
        expect(ServiceManager.instance.runningWorkers()).eq(1);
        done();
      }
    });
    factory(options, logger);
  });
  it("index starts configurable number of workers", done => {
    let options = {
      numberWorkers: 3
    };
    ServiceManager.instance.on("child", (state: string, child: any) => {
      if (state === "running") {
        if (ServiceManager.instance.runningWorkers() === 3) {
          done();
        }
      }
    });
    factory(options, logger);
  });
});
