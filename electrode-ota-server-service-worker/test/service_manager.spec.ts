"use strict";

import ServiceManager, { STATE_STOPPED } from "../src/service_manager";
import * as child_process from "child_process";
import { expect } from "chai";
import { join } from "path";
import { EventEmitter } from "events";
import { pid } from "process";
let sinon = require("sinon");

const options = {
  exec: join(__dirname, "./test_worker.ts"),
  args: [],
  numberWorkers: 1
};

class ProcessHelper {
  private handle: any;
  constructor(h: any) {
    this.handle = h;
  }
  ping() {
    return this.sendMessage("ping");
  }
  sendKill(code: string) {
    return this.handle.kill(code);
  }
  sendMessage(msg: string) {
    const pms = this.waitForMessage();
    this.handle.send({ action: msg });
    return pms;
  }
  waitForMessage() {
    return new Promise((resolve: any) => {
      this.handle.once("message", (data: string) => {
        resolve(data);
      });
    });
  }
}

describe("service-manager tests", function() {
  this.timeout(10000);

  let sandbox: any;
  let svc: any;
  let logger: any;
  let messages: any;

  before(() => {
    logger = {
      loggerInfo: [],
      loggerError: [],
      info: (msg: string) => {
        logger.loggerInfo.push(msg);
      },
      error: (msg: string) => {
        logger.loggerError.push(msg);
      }
    };
  });

  after(done => {
    return child_process.execFile(
      "ps",
      ["-p", "" + pid],
      (err: Error, stdout: string, stderr: string) => {
        const procs = stdout
          .split("\n")
          .filter(x => x.indexOf("" + pid) >= 0 && x.indexOf("test_worker") >= 0);

        expect(procs.length).eq(0);
        done();
      }
    );
  });

  beforeEach(() => {
    logger.loggerInfo = [];
    logger.loggerError = [];
    messages = {};
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    expect(svc.state).eq(STATE_STOPPED);
    expect(svc.runningWorkers()).eq(0);
  });

  const startService = (opt: any = options, logr: any = logger): Promise<any> => {
    svc = new ServiceManager(logr);
    const ph: ProcessHelper[] = [];
    const pms = new Promise((resolve: any) => {
      let listener = (state: string, child: any) => {
        if (state === "starting") {
          const h = new ProcessHelper(child);
          ph.push(h);
          if (opt.numberWorkers === 1) {
            svc.removeListener("child", listener);
            resolve(h);
          } else if (ph.length === opt.numberWorkers) {
            svc.removeListener("child", listener);
            resolve(ph);
          }
        }
      };
      svc.on("child", listener);
    });
    svc.start(opt);
    return opt.numberWorkers === 0 ? Promise.resolve() : pms;
  };
  const stopService = () => {
    const pms = new Promise((resolve: any) => {
      svc.once("manager", (state: string) => {
        if (state === "stopped") {
          svc.removeAllListeners("child");
          svc.removeAllListeners("manager");
          resolve();
        }
      });
    });
    svc.stop();
    return pms;
  };

  it("test starts worker", () => {
    return startService()
      .then((child: ProcessHelper) => child.ping())
      .then(resp => {
        expect(resp).equal("pong");
      })
      .then(() => stopService());
  });

  it("test calling service.stop() after receiving start message", () => {
    return startService().then(child => stopService());
  });

  it("test workers count", () => {
    return startService()
      .then((child: ProcessHelper) => {
        expect(svc.runningWorkers()).eq(1);
      })
      .then(() => stopService())
      .then(() => {
        expect(svc.runningWorkers()).eq(0);
        expect(svc.state).eq(STATE_STOPPED);
      });
  });

  it("test workers forward stdout to log", () => {
    expect(logger.loggerInfo.length).eq(0);
    return startService()
      .then((child: ProcessHelper) => child.sendMessage("stdout"))
      .then(resp => {
        expect(resp).eq("ok");
        expect(logger.loggerInfo.length).eq(2);
        expect(logger.loggerInfo[0]).eq(
          "[electrode-ota-service-worker] 1 service worker(s) starting"
        );
        expect(logger.loggerInfo[1]).eq("Hello World\n");
      })
      .then(() => stopService());
  });

  it("test workers forward stderr to log", () => {
    expect(logger.loggerError.length).eq(0);
    return startService()
      .then((child: ProcessHelper) => child.sendMessage("stderr"))
      .then(resp => {
        expect(resp).eq("ok");
        expect(logger.loggerError.length).eq(1);
        expect(logger.loggerError[0]).eq(`Yo error\n`);
      })
      .then(() => stopService());
  });

  it("test worker restarts if killed", () => {
    return startService()
      .then((child: ProcessHelper) => {
        return child.ping().then(resp => {
          expect(resp).eq("pong");
          let exited = false;

          return new Promise(resolve => {
            svc.on("child", (state: string, child: any) => {
              if (state === "starting") {
                expect(exited).eq(true);
                resolve();
              }
              if (state === "exited") {
                exited = true;
              }
            });
            child.sendKill("SIGINT");
          });
        });
      })
      .then(() => stopService());
  });

  it("test without logger", () => {
    return startService(options, null)
      .then((child: ProcessHelper) => {
        return child
          .sendMessage("stdout")
          .then(resp => {
            expect(resp).eq("ok");
            expect(logger.loggerInfo.length).eq(0);
            return child.sendMessage("stderr");
          })
          .then(resp => {
            expect(resp).eq("ok");
            expect(logger.loggerError.length).eq(0);
          });
      })
      .then(() => stopService());
  });

  it("test starting 2 processes", () => {
    const newOptions = Object.assign({}, options, { numberWorkers: 2 });
    return startService(newOptions)
      .then((childs: ProcessHelper[]) => {
        expect(childs.length).eq(2);
        return childs[0]
          .ping()
          .then(resp => {
            expect(resp).eq("pong");
            return childs[1].ping();
          })
          .then(resp => {
            expect(resp).eq("pong");
          });
      })
      .then(() => stopService());
  });

  it("test calling stop without any processes started", () => {
    const newOptions = Object.assign({}, options, { numberWorkers: 0 });
    return startService(newOptions).then(() => stopService());
  });
});

describe("Fake ServiceManager", () => {
  let logger: any;
  let sandbox: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = {
      loggerInfo: [],
      loggerError: [],
      info: (msg: string) => {
        logger.loggerInfo.push(msg);
      },
      error: (msg: string) => {
        logger.loggerError.push(msg);
      }
    };
  });
  afterEach(() => {
    sandbox.restore();
  });

  class FakeChildProcess extends EventEmitter {
    construct() {}
    kill(signal: string) {}
  }

  it("test child fails to fork", done => {
    let fakeChild = new FakeChildProcess();
    sandbox.stub(child_process, "fork").returns(fakeChild);
    let mockSvc = new ServiceManager(logger);

    mockSvc.on("child", (state: string) => {
      if (state === "error") {
        expect(logger.loggerError.length).eq(1);
        expect(logger.loggerError[0]).eq(
          "[electrode-ota-service-worker] Unable to fork process Error: Failures"
        );
        mockSvc.stop();
        done();
      }
    });
    mockSvc.start(options);
    const err = new Error(`Failures`);
    fakeChild.emit("error", err);
  });

  it("test child fails to fork without logger", done => {
    let fakeChild = new FakeChildProcess();
    sandbox.stub(child_process, "fork").returns(fakeChild);
    let mockSvc = new ServiceManager();

    mockSvc.on("child", (state: string) => {
      if (state === "error") {
        mockSvc.stop();
        done();
      }
    });
    mockSvc.start(options);
    const err = new Error(`Failured, unlogged`);
    fakeChild.emit("error", err);
  });
});
