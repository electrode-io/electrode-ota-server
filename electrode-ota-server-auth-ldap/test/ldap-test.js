import ldapClient from '../src/ldap-client';
import {expect} from 'chai';
const config = {

    url: 'ldap://ldap.forumsys.com:389',
    port: 389,
    defaultSearch: 'cn=read-only-admin,dc=example,dc=com',
    bindPassword: 'password'
};
const example = {
    "url": "ldap://{your_ldap_server}:{port}",
    "timeout": 50000,
    "defaultNS": "{active_directory_ns if exists",
    "defaultSearch": "{default_search_dn}",
    "connectTimeout": 100000


};
let conf;
if (process.env.LDAP_CONF && process.env.LDAP_TEST_USER && process.LDAP_TEST_PASSWORD) {
    conf = JSON.parse(process.env.LDAP_CONF);
}


describe('ldap-client', function () {
    let _it = conf ? it : it.skip;
    _it('should connect', function (done) {
        let client = ldapClient(conf)

        client(process.env.LDAP_TEST_USER, process.LDAP_TEST_PASSWORD, function (e, o) {
            if (e) return done(e);
            expect(o).to.be.true;
            done();
        });
    });
    it('may skip if config is not configured')
});