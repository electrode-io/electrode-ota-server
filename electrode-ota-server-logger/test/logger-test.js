import { loggerFactory } from "../src";
import { expect } from "chai";
import intercept from "intercept-stdout";
import * as gelfStream from "gelf-stream";
import Promise from "bluebird";

describe("loggerFactory", function() {
    this.timeout(10000);

    it("should create a default logger", () => {
        return loggerFactory(undefined, mockRegister).then((logger) => {
            expect(logger).not.to.be.undefined;
            ["info", "error", "warn", "trace", "fatal"].forEach((method) => {
                expect(typeof logger[method]).to.eq("function");
            });
        });
    });

    xdescribe("default logger", () => {
        it("should write to stdout", (done) => {
            const eventName = "someEvent";
            const eventLog = { event : { name : eventName, data : "stuff" }};
            return loggerFactory(undefined, mockRegister).then((logger) => {
                const dereg = intercept((text) => {
                    dereg();
                    expect(text).to.contain(eventName);
                    done();
                });

                logger.info(eventLog, "unit test for logging");
            });
        });
    });

    describe("graylog logger", () => {
        const gStream = gelfStream.forBunyan("localhost", 12201, {
            // additional fields appended to every message
            defaults : {
                env : process.env.NODE_ENV || process.env.ONEOPS_ENVIRONMENT || "dev",
                assembly : "electrode-ota-server-logger-test"
            }
        });

        const options = {
            bunyan : {
                streams : [{
                    name : "graylog",
                    type : "raw",
                    stream : gStream
                }]
            }
        };

        it("should write to graylog", (done) => {
            const eventName = "testGraylogEvent";
            const eventData = {
                data : "junk and stuff"
            };

            loggerFactory(options, mockRegister).then((logger) => {
                logger.info(eventData, eventName);

                new Promise((resolve, reject) => {
                    setTimeout(resolve, 100);
                }).tap(() => {
                    logger.info({ another : "event"}, "another test event");
                    done();
                });
            });
        });
    });
});

function mockRegister(options, callback) {
    callback();
}