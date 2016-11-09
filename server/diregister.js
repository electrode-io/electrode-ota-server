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
const resolveable = (name)=> {
    const ret = {name};
    ret.promise = new Promise(function (_resolve, _reject) {
        ret.resolve = _resolve;
        ret.reject = _reject;
    });
    return ret;
};

const registerContext = (reg)=> {
    if (reg.plugins.diregister) {
        return reg.plugins.diregister;
    }
    const PROMISES = {};
    const MODULES = {};

    const registering = [];
    const registered = [];

    const notResolvedFilter = (dep)=>!(/:/.test(dep) || (dep in MODULES));

    const printNotResolved = ({name, dependencies = []})=> {
        let str = `\n${name}`;
        dependencies = dependencies.filter(notResolvedFilter);
        if (dependencies && dependencies.length) {
            str += `\n\t-> unresolved[${dependencies.join(',')}]\n`;
        }
        return str;
    };

    reg.on('stop', ()=> {
        if (registering.length !== registered.length) {
            const delta = registering.filter(inflight=>registered.indexOf(inflight.name) == -1);
            console.error(`\n\nThe following component(s) have not resolved\n%s\nregistered:\n %s\n`,
                delta.map(printNotResolved).join('\n'),
                registered.join('\n')
            );
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
        registering.push({name, dependencies});
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
    register.attributes.dependencies = [];
    return register;
};
module.exports = diregister;
