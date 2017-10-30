import { loggerFactory } from "../src";
import { expect } from "chai";
import intercept from "intercept-stdout";
import * as gelfStream from "gelf-stream";
import Promise from "bluebird";

describe("loggerFactory", function() {
    this.timeout(10000);

    it("should create a default logger", () => {
        const logger = loggerFactory(undefined, mockRegister);
        expect(logger).not.to.be.undefined;
        ["error", "warn", "debug", "info", "log", "trace"].forEach((method) => {
            expect(typeof logger[method]).to.eq("function");
        });
    });

    describe("default logger", () => {
        it("should write to stdout", (done) => {
            const eventName = "someEvent";
            const eventLog = { event : { name : eventName, data : "stuff" }};
            const logger = loggerFactory(undefined, mockRegister);
            const dereg = intercept((text) => {
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