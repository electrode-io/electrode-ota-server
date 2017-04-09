import randomstring from "randomstring";

import crypto from 'crypto';

const genString = (length = 40)=>randomstring.generate({length, charset: 'alphabetic'});

const id = (length = 8) =>genString(length);

const values = obj => obj ? Object.keys(obj).map(key => obj[key]) : obj;

const shasum = (str, hash='sha256', digest='hex') => crypto.createHash(hash).update(str).digest(digest);
/**
 * Reduces and returns, by default an object.
 * Does not care bout the return of the function.
 *
 * @param arr
 * @param fn
 * @param ret
 */
const reducer = (arr, fn, ret = {})=> arr.reduce((ret, ...args)=> {
    fn(ret, ...args);
    return ret;
}, ret);

const map = (obj, fn)=>Object.keys(obj).map((key, ...args)=>fn(obj[key], key, ...args));


const wrap = api => reducer(Object.keys(api), (ret, key) => ret[key] = (...args) => {
    const cb = args.pop();
    if (typeof cb === 'function') {
        api[key](...args).then(result => cb(null, result), cb);
    } else {
        return api[key](...args, cb);
    }
});

const promiseMapping = (keys, promises) => Promise.all(promises)
    .then(results => reducer(results, (ret, val, idx) => ret[keys[idx]] = val));

/**
 * Shallow Promise from map.
 * @param map
 */
const promiseMap = (map)=> {
    const keys = Object.keys(map);
    return promiseMapping(keys, keys.map(k=>map[k]));
};


const remove = (arr, val)=> {
    if (!arr) return arr;
    let idx;
    while ((idx = arr.indexOf(val)) > -1) {
        arr.splice(idx, 1);
    }
    return arr;
};

module.exports = {
    genString,
    id,
    key: genString,
    map,
    promiseMap,
    promiseMapping,
    reducer,
    remove,
    shasum,
    values,
    wrap,

};
