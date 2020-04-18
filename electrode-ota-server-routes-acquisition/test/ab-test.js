import { expect } from "chai";
import * as abTest from "../src/ab-test";

describe("A/B Test", function() {
    this.timeout(500000);
    let downloadUrl;
    let id;
    let plan;
    let absetup;

    beforeEach(() => {
        downloadUrl = "http://localhost:9001/storagev2/";
        id = "623AA5F586BA";
        plan = "35CF";
        absetup = "expA";
    });

    it("should buildUrl() return non-cached URL", () => {
        expect(abTest.buildUrl(downloadUrl, id, plan, absetup)).to.match(/storagev2/);
    });

    it("should buildUrl() return cached URL", () => {
        id = "623AA5F586BC";
        expect(abTest.buildUrl(downloadUrl, id, plan, absetup)).to.match(/deltaPackage/);
    });

    it("should buildUrl() return cached URL, when overriden by param 'absetup'", () => {
        absetup = "expB";
        expect(abTest.buildUrl(downloadUrl, id, plan, absetup)).to.match(/deltaPackage/);
    });

    it("should shouldSendCachedUrl() say for 'all' or '*'", () => {
        expect(abTest.shouldSendCachedUrl(id, "*")).to.be.equal(true);
        expect(abTest.shouldSendCachedUrl(id, "all")).to.be.equal(true);
    });

    it("should shouldSendCachedUrl() say for 'all' or '*'", () => {
        expect(abTest.shouldSendCachedUrl(id, "*")).to.be.equal(true);
        expect(abTest.shouldSendCachedUrl(id, "all")).to.be.equal(true);
    });
});