import path from 'path';
import otaServer from 'electrode-ota-server';
import {expect} from 'chai';

describe('sso-test', function() {
    this.timeout(50000);

    let server;
    before(() => {
        const config_dir = path.join(__dirname, 'config');
        return otaServer(config_dir).then(svr => {
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