import path from 'path';
import otaServer from 'electrode-ota-server';
import {expect} from 'chai';
process.env.OTA_CONFIG_DIR = path.join(__dirname, 'config');
process.env.NODE_ENV = 'test';
process.env.PORT = 9999;

describe('sso-test', function() {
    this.timeout(50000);

    let server;
    before(() => {
        return otaServer(process.env.OTA_CONFIG_DIR).then(svr => {
            server = svr;
        });
    });
    after(() => {
        return server && server.stop();
    });

    it('Test SSO register', () => {
        const req = {
            method: 'GET',
            url: '/auth/register/walmart-sso',
            headers: {}
        };
        return server.inject(req).then(
            response => {
                expect(response.statusCode).to.equal(302, response.statusMessage);
                // Expect session cookie after successful register
                expect(response.headers['set-cookie'][0]).to.match(/^jchen-auth-cookie/);
            }
        );
    });
    it('Test SSO login', () => {
        const req = {
            method: 'GET',
            url: '/auth/login/walmart-sso'
        };
        return server.inject(req).then(response => {
            expect(response.statusCode).to.equal(302, response.statusMessage);
            // Expect session cookie after successful login
            expect(response.headers['set-cookie'][0]).to.match(/^jchen-auth-cookie/);
        });
    });
});