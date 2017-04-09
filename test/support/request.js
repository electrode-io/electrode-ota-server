const expect = require('chai').expect;
const handle = (resolve) => r => {
    const contentType = r.headers['content-type'] || "";
    if (contentType.indexOf('application/json') > -1) {
        r.body = JSON.parse(r.payload);
    }
    resolve(r);
};
const P = fn => new Promise(fn);
const body = eql => r => expect(r.body).to.eql(eql);
const match = (re) => r => expect(r.result).to.match(re);

const all = (checks) => (checks == null || checks.length == 0) ? null : (...args) => Array.isArray(checks) ? Promise.all(checks.map(fn => fn && fn(...args))) : checks(...args);
const makeRequester = (server) => (options, check, errorCheck) => {
    return P(resolve => server.inject(options, handle(resolve))).then(all(check), all(errorCheck));
};
const auth = (username, password) => 'Basic ' + new Buffer(`${username}:${password}`).toString('base64');

const tokenRe = /<span class="token">([a-z0-9A-Z]+?)<\/span>/;
module.exports = {
    P,
    auth,
    all,
    makeRequester,
    body,
    match,
    handle, tokenRe
};
