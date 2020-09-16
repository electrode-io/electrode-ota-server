import { expect } from "chai";
import isProtected from "../src/is-protected";

describe("isProtected() Test", function() {
    this.timeout(500000);
    const dKey = "foo-bar-eeWWW-lorem-IpsiUM-FoO-bAr";

    it("should return false by default", () => {
        expect(isProtected()).to.be.equal(false);
    });

    it("should return false if no protectedPacks", () => {
        expect(isProtected(dKey)).to.be.equal(false);
    });

    it("should return false if protectedPacks value is invalid", () => {
        expect(isProtected(dKey, "")).to.be.equal(false);
        expect(isProtected(dKey, " ")).to.be.equal(false);
    });

    it("should return false if the deployment key is not protected", () => {
        const protectedPacks = "foo-bar-eeWWW-lorem-IpsiUM-FoO-bXr,foo-bar-eeWWW-lorem-IpsiUM-FoO-bYr,foo-bar-blah-blah-meh";
        expect(isProtected(dKey, protectedPacks)).to.be.equal(false);
    });

    it("should return true if deploymentKey is protected", () => {
        const protectedPacks = "foo-bar-eeWWW-lorem-IpsiUM-FoO-bZr,foo-bar-eeWWW-lorem-IpsiUM-FoO-bAr,foo-bar-blah-blah-meh";
        expect(isProtected(dKey, protectedPacks)).to.be.equal(true);
    });

    it("deploymentKey should be case-sensitive", () => {
        const protectedPacks = "foo-bar,blah-blah-meh-blah,f0o-Blah-bAr-m3h";
        // invalid cases
        expect(isProtected("Foo-Bar", protectedPacks)).to.be.equal(false);
        expect(isProtected("f0o-Blah-bAr-m3H", protectedPacks)).to.be.equal(false);
        expect(isProtected("foo-bar, blah-blah-meh-blah, f0o-Blah-bAr-m3h", protectedPacks)).to.be.equal(false);
        // valid cases
        expect(isProtected("foo-bar", protectedPacks)).to.be.equal(true);
        expect(isProtected("f0o-Blah-bAr-m3h", protectedPacks)).to.be.equal(true);
        expect(isProtected("blah-blah-meh-blah", "foo-bar, blah-blah-meh-blah, f0o-Blah-bAr-m3h")).to.be.equal(true);
    });
});
