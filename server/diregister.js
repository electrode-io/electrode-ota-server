"use strict";
/**
 * Use this to make registering plugins with hapi, less terrible.
 *
 * EX:
 * ```js
 * const diregister = require('diregister');
 *
 * diregister({
 * name:'stuff',
 * dependencies:['other', 'electrode!route']
 * }, (options, other, route)=>{
 *  //Return a promise if you need async.
 *  // other wise just do stuff here
 *  // route({});
 * });
 *
 * ```
 *
 * @param obj
 * @param dep
 * @returns {*}
 */
const result = (obj, dep)=> {
    if (!obj)return obj;
    if (typeof obj[dep] === 'function') {
        return obj[dep].bind(obj);
    }
    return obj[dep];
};

//Allow for different handlers.
const HANDLERS = {
    electrode: (server, dep, options)=>result(server, dep)
};
const resolveable = (name, parent)=> {
    const ret = {parent};
    ret.promise = new Promise(function (_resolve, _reject) {
        ret.resolve = _resolve;
        ret.reject = _reject;
    }, 5000, name);
    return ret;
};

const tab = (count, repeat = '\t')=> {
    let str = '';
    while (count-- > 0) {
        str += repeat;
    }
    return str;
};

const registerContext = (reg)=> {
    if (reg.plugins.diregister) {
        return reg.plugins.diregister;
    }
    const PROMISES = {};
    const MODULES = {};

    const registering = [];
    const registered = [];

    reg.on('stop', ()=> {
        if (registering.length !== registered.length) {
            const delta = registering.filter(inflight=>registered.indexOf(inflight) == -1);
            console.error(`\n\nThe following component(s) have not resolved \n`, delta.join('\n'))
        }
    });


    const waitForModule = (name, parent)=> {
        if (name in MODULES) {
            return MODULES[name]
        }
        const ref = PROMISES[name] || (PROMISES[name] = resolveable(name));
        if (parent) {
            if (ref.parents) {
                ref.parents.push(parent);
            } else {
                ref.parents = [parent];
            }
        }
        return ref.promise;
    };

    const resolveModule = (name, value = null)=> {
        if (name in MODULES) {
            if (MODULES[name] !== value) {
                throw new Error(`${name} resolves to different value`);
            }
            return MODULES[name];
        } else {
            MODULES[name] = value;
        }
        const promise = PROMISES[name];
        if (promise && promise.promise) {
            promise.promise = false;
            promise.resolve(value);
        }
        return value;
    };


    const resolve = (name, dependencies = [], fn, handlers, server, options, next)=> {
        registering.push(name);
        dependencies = dependencies || [];
        Promise.all(dependencies.map((dep)=> {
            const [namespace, cmd] = dep.split(':', 2);
            if (cmd && handlers[namespace]) {
                return handlers[namespace](server, cmd, options);
            }
            return waitForModule(dep, name);
        })).then((args = [], next)=>fn(options, ...args)).then((value)=> {
            registered.push(name);
            next();
            return resolveModule(name, value);
        }, next);
    };

    return (reg.plugins.diregister = resolve);
};


module.exports.HANDLERS = HANDLERS;


const diregister = (attributes = {dependencies: []}, fn, handlers = HANDLERS) => {


    const name = attributes.name;
    const dependencies = attributes.dependencies ? Array.isArray(attributes.dependencies) ? attributes.dependencies : attributes.dependencies : [];

    const register = (server, options, next)=> registerContext(server)(name, dependencies, fn, handlers, server, options, next);

    register.attributes = attributes;
    //might just get rid of dependencies, as it seems kinda useless.
    register.attributes.dependencies = dependencies.filter(v=>!/:/.test(v));
    return register;
};
module.exports = diregister;
