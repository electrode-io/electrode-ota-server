"use strict";

import { fork, ChildProcess } from "child_process";
import { expect } from "chai";
import { join } from "path";

describe("service-worker tests", () => {
  let cp: ChildProcess | null;

  function forkWorker(args: any = []): ChildProcess {
    const options: any = {};
    const proc = fork(join(__dirname, "../src/service_worker.ts"), args, options);
    return proc;
  }

  afterEach(() => {
    if (cp) {
      cp.kill("SIGINT");
    }
  });

  it("service worker sends ok status", done => {
    cp = forkWorker();
    cp.once("message", data => {
      expect(data.status).eq("OK");
      done();
    });
  });

  it("service worker exits on SIGINT", done => {
    cp = forkWorker();
    cp.once("message", data => {
      expect(data.status).eq("OK");
      if (cp) {
        cp.kill("SIGINT");
      }
    });
    cp.once("exit", () => {
      cp = null;
      done();
    });
  });

  it("service worker sleeps a time", done => {
    cp = forkWorker(["--sleep", 100]);
    cp.once("message", data => {
      expect(data.status).eq("OK");
      expect(data.sleep).eq(100);
      done();
    });
  });
});
