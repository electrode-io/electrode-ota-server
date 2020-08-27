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

    it("should return a valid response for /updateCheck request", () => {
        ccm = () => "";
        reply = result => {
            expect(result.updateInfo).to.equal(updateInfo);
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
});