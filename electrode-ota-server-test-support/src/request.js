import { expect } from 'chai';

export const handle = (resolve) => r => {
    const contentType = r.headers['content-type'] || "";
    if (contentType.indexOf('application/json') > -1) {
        r.body = JSON.parse(r.payload);
    }
    resolve(r);
};

export const P = fn => new Promise(fn);

export const body = eql => r => expect(r.body).to.eql(eql);

export const match = (re) => r => expect(r.result).to.match(re);

export const all = (checks) => (checks == null || checks.length == 0) ? null : (...args) => Array.isArray(checks) ? Promise.all(checks.map(fn => fn && fn(...args))) : checks(...args);

export const makeRequester = (server) => (options, check, errorCheck) => {
    return P(resolve => server.inject(options, handle(resolve))).then(all(check), all(errorCheck));
};

export const auth = (username, password) => 'Basic ' + new Buffer(`${username}:${password}`).toString('base64');

export const tokenRe = /<span class="token">([a-z0-9A-Z]+?)<\/span>/;

export default ({
    P,
    auth,
    all,
    makeRequester,
    body,
    match,
    handle, tokenRe
});
