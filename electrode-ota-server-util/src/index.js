import randomstring from "randomstring";
import crypto from 'crypto';

export const genString = (length = 40) => randomstring.generate({ length, charset: 'alphabetic' });

export const id = (length = 8) => genString(length);

export const values = obj => obj ? Object.keys(obj).map(key => obj[key]) : obj;

export const shasum = (str, hash = 'sha256', digest = 'hex') => crypto.createHash(hash).update(str).digest(digest);
/**
 * Reduces and returns, by default an object.
 * Does not care bout the return of the function.
 *
 * @param arr
 * @param fn
 * @param ret
 */
export const reducer = (arr, fn, ret = {}) => arr.reduce((ret, ...args) => {
    fn(ret, ...args);
    return ret;
}, ret);

export const map = (obj, fn) => Object.keys(obj).map((key, ...args) => fn(obj[key], key, ...args));


export const wrap = api => reducer(Object.keys(api), (ret, key) => ret[key] = (...args) => {
    const cb = args.pop();
    if (typeof cb === 'function') {
        api[key](...args).then(result => cb(null, result), cb);
    } else {
        return api[key](...args, cb);
    }
});

export const promiseMapping = (keys, promises) => Promise.all(promises)
    .then(results => reducer(results, (ret, val, idx) => ret[keys[idx]] = val));

/**
 * Shallow Promise from map.
 * @param map
 */
export const promiseMap = (map) => {
    const keys = Object.keys(map);
    return promiseMapping(keys, keys.map(k => map[k]));
};


export const remove = (arr, val) => {
    if (!arr) return arr;
    let idx;
    while ((idx = arr.indexOf(val)) > -1) {
        arr.splice(idx, 1);
    }
    return arr;
};
export const toJSON = (v, exclude) => {
    if (v && v.toJSON) {
        return v.toJSON();
    }
    else if (Array.isArray(v)) return v.map(toJSON);
    return v;
};
export const key = genString;
export const waitFor = function (fn, scope, ...args) {
    if (typeof fn == 'string') {
        fn = scope[fn];
    }
    return new Promise((resolve, reject) => fn.apply(scope, args.concat((e, o) => e ? reject(e) : resolve(o))));

};
export const promisify = (fn, scope) => function (...args) {
    return waitFor(fn, scope || this, ...args);
};

/**
 * Used with the logger to reduce the number of properties in a request object that are getting logged
 *
 * @param {*} req a Hapi Request object
 *
 * returns a new object with just the properties we are interested in
 */
export const reqFields = function (req) {
    return {
        requestId: req.id,
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.info.remoteAddress,
        remotePort: req.info.remotePort
    };
}

export const aes256Encrypt = function (passkey, data) {
    const aes = crypto.createCipher("aes256", passkey);
    let encrypted = aes.update(data, "utf8", "hex");
    encrypted += aes.final('hex');
    return encrypted;
}

export const aes256Decrypt = function (passkey, encrypted) {
    const aes = crypto.createDecipher("aes256", passkey);
    let decrypted = aes.update(encrypted, "hex", "utf8");
    decrypted += aes.final("utf8");
    return decrypted;
}

export const toBuf = stream => new Promise((resolve, reject) => {
    const bufs = [];
    stream.on('data', function (d) {
        bufs.push(d);
    });
    stream.on('error', reject);
    stream.on('end', function () {
        resolve(Buffer.concat(bufs));
    });
});

export const streamToBuf = (stream) => {
    if (stream instanceof Buffer) {
        return Promise.resolve(stream);
    }
    if (stream instanceof Uint8Array) {
        return Promise.resolve(Buffer.from(stream));
    }
    if (stream instanceof Stream) {
        return toBuf(stream);
    }
};

export default ({
    toBuf,
    streamToBuf,
    aes256Decrypt,
    aes256Encrypt,
    toJSON,
    promisify,
    waitFor,
    genString,
    id,
    key,
    map,
    promiseMap,
    promiseMapping,
    reducer,
    remove,
    shasum,
    values,
    wrap,
    reqFields,
});
