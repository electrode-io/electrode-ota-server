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
const error = (e)=> {
    console.error('Error', e);
};
const diregister = (attributes = {dependencies: []}, fn, handlers = HANDLERS) => {
    if (Array.isArray(attributes)) {
        attributes = {dependencies: attributes};
    } else if (typeof attributes === 'string') {
        attributes = {dependencies: attributes.split(/,\s*/)};
    }


    const dependencies = attributes.dependencies ? Array.isArray(attributes.dependencies) ? attributes.dependencies : [attributes.dependencies] : [];

    const register = (server, options, next)=> {

        Promise.all(dependencies.map((dep)=> {
            const [namespace, cmd] = dep.split(':', 2);
            if (cmd && handlers[namespace]) {
                return handlers[namespace](server, cmd, options);
            }
            //I dunno why this is needed but, it is.
            if (server.plugins[dep]) {
                return server.plugins[dep];
            }
            return new Promise((resolve)=> server.dependency(dep, (_server, _next)=> {
                if (!(dep in _server.plugins)) {
                    return _next(new Error(`Could not resolve dependency "${dep}" being included from "${attributes.name}"`))
                }
                resolve(_server.plugins[dep]);
                _next();
            }));

        })).then((args = [])=> {
            const ret = fn(options, ...args);
            if (ret !== void(0) && attributes.name &&! server.plugins[attributes.name]) {
                server.plugins[attributes.name] = ret;
            }
            return ret;
        }).then(_=>next(), error);

    };
    register.attributes = attributes;
    //might just get rid of dependencies, as it seems kinda useless.
    register.attributes.dependencies = dependencies.filter(v=>!/:/.test(v));
    return register;
};
//expose
diregister.HANDLERS = HANDLERS;

module.exports = diregister;
