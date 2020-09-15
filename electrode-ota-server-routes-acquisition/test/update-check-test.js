/* eslint-disable max-statements */
import { expect } from "chai";
import handlers from "../src/handlers";

describe("updateCheck() Test for Protected Packages", function() {
    this.timeout(500000);
    let acquisitionUpdateCheck;
    let deploymentKey;
    let ccm;
    let logger;
    let reply;
    let request;
    let updateInfo;

    beforeEach(() => {
        updateInfo = { isAvailable: false, shouldRunBinaryVersion: false };
        acquisitionUpdateCheck = (qs, callback) => {
            callback(null, updateInfo);
        };
        deploymentKey = "foo-bar-123";
        ccm = s => s === "packsProtected" ? deploymentKey : "";
        logger = console;
        reply = o => o;
        request = {
            id: "xyz987",
            headers: {},
            info: {
                remoteAddress: "localhost",

                remotePort: "3000"
            },
            method: "GET",
            url: {
                pathname: "updateCheck"
            },
            query: {
                appVersion: "1.2.3",
                clientUniqueId: "abcd45",
                deploymentKey
            }
        };
    });

    it("should throw Deployment key missing", () => {
        request.query.deploymentKey = null;
        expect(handlers.updateCheck.bind(handlers, request, reply, logger, ccm, acquisitionUpdateCheck)).to.throw("Deployment key missing");
    });

    it("should throw Deployment key missing", () => {
        request.query.appVersion = null;
        expect(handlers.updateCheck.bind(handlers, request, reply, logger, ccm, acquisitionUpdateCheck)).to.throw("appVersion missing");
    });

    it("should throw Unauthorized for /updateCheck asking for a protected package", () => {
        expect(handlers.updateCheck.bind(handlers, request, reply, logger, ccm, acquisitionUpdateCheck)).to.throw("Unauthorized");
    });

    it("should throw Unauthorized for /update_check asking for a protected package", () => {
        request.url.pathname = "update_check";
        request.query = {
            app_version: "1.2.3",
            client_unique_id: "abcd45",
            deployment_key: deploymentKey
        };
        expect(handlers.updateCheck.bind(handlers, request, reply, logger, ccm, acquisitionUpdateCheck)).to.throw("Unauthorized");
    });

    it("should return a valid response for /updateCheck request", () => {
        ccm = () => "";
        reply = result => {
            expect(result.updateInfo).to.equal(updateInfo);
        };
        handlers.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
    });

    it("should return a valid response for /update_check request", () => {
        request.url.pathname = "update_check";
        request.query = {
            app_version: "1.2.3",
            client_unique_id: "abcd45",
            deployment_key: deploymentKey
        };
        ccm = () => "";
        reply = result => {
            expect(result.updateInfo.is_available).to.be.false;
            expect(result.updateInfo.should_run_binary_version).to.be.false;
        };
        handlers.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
    });

    it("should return a valid response for /auth/updateCheck request", () => {
        request.url.pathname = "auth/updateCheck";
        ccm = () => "";
        reply = result => {
            expect(result.updateInfo).to.equal(updateInfo);
        };
        handlers.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
    });

    it("should return a valid response for /auth/update_check request", () => {
        request.url.pathname = "auth/update_check";
        request.query = {
            app_version: "1.2.3",
            client_unique_id: "abcd45",
            deployment_key: deploymentKey
        };
        ccm = () => "";
        reply = result => {
            expect(result.updateInfo.is_available).to.be.false;
            expect(result.updateInfo.should_run_binary_version).to.be.false;
        };
        handlers.updateCheck(request, reply, logger, ccm, acquisitionUpdateCheck);
    });
});
