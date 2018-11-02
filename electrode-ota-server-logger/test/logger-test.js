import { loggerFactory, noOp } from "../src";
import { expect } from "chai";
import intercept from "intercept-stdout";
import Promise from "bluebird";
import { executionAsyncId } from "async_hooks";

describe("loggerFactory", function() {
  this.timeout(10000);

  it("should create a default logger", () => {
    const logger = loggerFactory(undefined, mockRegister);
    expect(logger).not.to.be.undefined;
    ["error", "warn", "debug", "info", "log", "trace"].forEach(method => {
      expect(typeof logger[method]).to.eq("function");
    });
  });

  it("should create no-op loggers", () => {
    const logger = loggerFactory({ level: "info" }, mockRegister);
    expect(logger).not.undefined;
    ["error", "warn", "info"].forEach(method => {
      expect(typeof logger[method]).eq("function");
      expect(logger[method]).not.equal(noOp);
    });
    ["log", "debug", "trace"].forEach(method => {
      expect(logger[method]).equal(noOp);
    });
  });

  it("should no-op trace level", () => {
    const logger = loggerFactory({ level: "trace" }, mockRegister);
    expect(logger).not.undefined;

    ["error", "warn", "debug", "info", "log", "trace"].forEach(method => {
      expect(typeof logger[method]).eq("function");
      expect(logger[method]).not.equal(noOp);
    });
  });

  it("should no-op error level", () => {
    const logger = loggerFactory({ level: "error" }, mockRegister);
    expect(logger).not.undefined;

    expect(typeof logger["error"]).eq("function");
    expect(logger["error"]).not.equal(noOp);
    ["warn", "info", "log", "debug", "trace"].forEach(method => {
      expect(logger[method]).equal(noOp);
    });
  });

  it("no-op logger should not write to stdout", () => {
    const logger = loggerFactory({ level: "warn" }, mockRegister);
    let loggedText = false;
    const dereg = intercept(text => {
      dereg();
      loggedText = text;
    });
    logger.info("blah blah");
    expect(loggedText).false;
  });

  describe("default logger", () => {
    it("should write to stdout", done => {
      const eventName = "someEvent";
      const eventLog = { event: { name: eventName, data: "stuff" } };
      const logger = loggerFactory(undefined, mockRegister);
      const dereg = intercept(text => {
        dereg();
        expect(text).to.contain(eventName);
        done();
      });

      logger.info(eventLog, "unit test for logging");
    });
  });
});

function mockRegister(options, callback) {
  callback();
}
