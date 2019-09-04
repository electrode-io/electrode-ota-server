"use strict";

import ServiceManager from "../src/service_manager";
import { createSandbox } from "sinon";
import { expect } from "chai";
import { join } from "path";
import { EventEmitter } from "events";

const options = {
  exec: join(__dirname, "./test_worker.ts"),
  args: []
};

describe("service-manager tests", () => {
  let sandbox: any;
  let logger: any;
  let svc: any;

  before(() => {
    svc = ServiceManager.instance;
  });

  beforeEach(() => {
    sandbox = createSandbox();
    logger = {
      info: sandbox.spy(),
      error: sandbox.spy()
    };
  });

  afterEach(() => {
    svc.removeAllListeners("child");
    sandbox.restore();
  });

  it("test starts and stops workers", done => {
    let hasStarted: boolean = false;
    let isRunning: boolean = false;

    svc.on("child", (state: string, child: any) => {
      if (state === "started") {
        hasStarted = true;
      } else if (state === "running") {
        isRunning = true;
        svc.stop();
      } else if (state === "exited") {
        expect(hasStarted, "Has not started").true;
        expect(isRunning, "isRunning should be true").true;
        done();
      }
    });
    svc.start(options, logger);
  });

  it("test worker dies clears worker list", done => {
    svc.on("child", (state: string) => {
      if (state === "running") {
        expect(svc.runningWorkers()).eq(1);
        svc.stop();
      } else if (state === "exited") {
        expect(svc.runningWorkers()).eq(0);
        done();
      }
    });
    svc.start(options, logger);
  });

  it("test workers forward stdout to log", done => {
    svc.on("child", (state: string) => {
      if (state === "running") {
        // Wait for 200ms timer to run
        setTimeout(() => {
          expect(logger.info.callCount).eq(2);
          expect(logger.info.getCall(0).args[0]).eq(
            "[electrode-ota-service-worker] 1 service worker(s) started"
          );
          expect(logger.info.getCall(1).args[0]).eq("Hello World\n");
          svc.stop();
          done();
        }, 300);
      }
    });
    svc.start(options, logger);
  });

  it("test workers forward stderr to log", done => {
    svc.on("child", (state: string) => {
      if (state === "running") {
        expect(logger.error.callCount).eq(1);
        expect(logger.error.getCall(0).args[0]).eq(`Yo useless error\n`);
        svc.stop();
        done();
      }
    });
    svc.start(options, logger);
  });
});

describe("Fake ServiceManager", () => {
  let logger: any;
  let sandbox: any;

  beforeEach(() => {
    sandbox = createSandbox();
    logger = {
      info: sandbox.spy(),
      error: sandbox.spy()
    };
  });

  it("test child fails to fork", done => {
    let fakeChild = new EventEmitter();
    let fake_child_process = {
      fork: () => fakeChild
    };
    let MockServiceManager = new ServiceManager(fake_child_process);

    MockServiceManager.on("child", (state: string) => {
      if (state === "error") {
        MockServiceManager.stop();
        done();
      }
    });
    MockServiceManager.start(options, logger);
    const err = new Error(`Failures`);
    fakeChild.emit("error", err);
  });
});
