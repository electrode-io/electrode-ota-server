export default (obj, scope, ...args)=> {
    return Object.keys(obj).reduce((ret, key)=> {
        ret[key] = obj[key].bind(scope, ...args);
        return ret;
    }, {});
};