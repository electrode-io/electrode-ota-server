export const Options = {Sep: `, `};

export default function (arry, factory, scope, sep = Options.Sep) {
    arry = arry || [];
    const l = arry.length - 1;
    return arry.reduce((ret, v, idx, a)=> {
        ret.push(factory.call(scope, v, idx, a));
        if (idx < l) {
            ret.push(sep)
        }
        return ret;
    }, []);
};