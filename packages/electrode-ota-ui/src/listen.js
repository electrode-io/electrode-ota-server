"use strict";
export default function (...listeners) {

    const ret = (...args)=> {
        for (const v of listeners) v && v(...args)
    };

    ret.add = listeners.push.bind(listeners);

    ret.remove = (...all)=> all.forEach((v)=> {
        let idx;
        while ((idx = listeners.indexOf(v)) > -1)
            listeners.splice(idx, 1);
    });

    return ret;
}