"use strict";

const path = require("path");
process.env.NODE_ENV = 'test';
process.env.PORT = 9999;
process.env.OTA_CONFIG_DIR = path.join(__dirname, 'config');
const otaServer = require("../index");
const initDao = require('./support/init-dao');
const expect = require("chai").expect;
const {
    auth,
    makeRequester,
    body,
    match,
    tokenRe
} = require('./support/request');

/**
 *  **** IMPORTANT ***
 *
 * This test exercises various pieces of the electrode-ota-server authentication mechanism.   It
 * could be expanded to show how to use your own authentication mechanism (such as HTTP Basic Auth).
 * The included Basic auth example is just that, please don't use it as is.   Make sure you handle
 * people's passwords with care.
 *
 * That said it is close to impossible to automate testing through OAuth, reliable.  As such
 * this has been added.
 *
 */
describe('electrode-ota-server', function () {
    this.timeout(10000);
    let server;
    before(() => initDao().then(()=>otaServer().then(r => server = r)));

    after(() => server && server.stop());

    const request = (options, check, errorCheck) => () => makeRequester(server)(options, check, errorCheck);

    it("should be authenticated false", request({method: 'GET', url: '/authenticated'}, body({authenticated: false})));
    it("should show register options", request({
        method: 'GET', url: '/auth/login', headers: {
            authentication: `Basic `
        }
    }, match(/<a href="\/auth\/login\/basic/)));

    it("should register and test Token options", request({
        method: 'GET',
        url: '/auth/register/basic',
        headers: {
            authorization: auth("test@walmartlabs.com", "abc123")
        }
    }, ({statusCode, headers}) => {
        expect(statusCode).to.eql(302);
        expect(headers).to.have.property("location", "/accesskey");
        return request({
            url: headers.location,
            headers: {
                Cookie: headers['set-cookie'][0].split(';')[0]
            }
        }, [
            match(tokenRe),
            ({result}) => request({
                url: '/authenticated',
                headers: {
                    authorization: `Bearer ${tokenRe.exec(result)[1]}`
                }
            }, body({authenticated: true}))()

        ])();
    }));

    it('should survive request without valid packageHash', request({
        url: '/updateCheck?deploymentKey=evHVNrwuJDVdTvpSouLxKpEyowtcxyWcyVCxnsFD&appVersion=1.2.3&packageHash=&isCompanion=&label=&clientUniqueId=76451410-77F2-423C-836C-623AA5F586B5'
    }, body({
        updateInfo: {
            isAvailable: false,
            shouldRunBinaryVersion: false
        }
    })));


});
