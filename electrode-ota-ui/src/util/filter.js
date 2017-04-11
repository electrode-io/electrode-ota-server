export default function (obj, fn) {
    const _fn = (typeof fn !== 'function') ? (v)=>v == fn : fn;
    if (Array.isArray(obj)) {
        return obj.filter(fn);
    }
    return Object.keys(obj).filter(fn, obj);
}