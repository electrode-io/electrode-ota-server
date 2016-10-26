"use strict";

const {wrap} = require('../util');
const diregister = require('../diregister');
const register = diregister({
    name: 'accessKeysRoute',
    dependencies: ['electrode:route', 'ota!account']
}, (options, route, acf) => {

    const {addAccessKey, listAccessKeys, updateAccessKey, removeAccessKey, account} = wrap(acf);

    route([
        {
            method: 'GET',
            path: '/account',

            config: {
                handler (request, reply) {
                    account(request.auth.credentials.email, (e, {account:{linkedProviders = ['GitHub'], name, email}})=> {
                        if (e) return reply(e);
                        reply({account: {linkedProviders, name, email}});
                    })
                }
            }
        },
        {
            method: 'POST',
            path: '/accessKeys/',
            config: {
                handler(request, reply){

                    const {auth:{credentials:{email, name}}, payload = {}, params:{key}} = request;
                    //email, createdBy, friendlyName, ttl
                    addAccessKey(email || name, request.connection.info.host, payload.friendlyName, payload.ttl, (e, accessKey)=> {
                        if (e) return reply(e);
                        const {createdBy, friendlyName, description, name, createdTime, expires} = accessKey;
                        reply({
                            accessKey: {
                                createdBy, friendlyName, description, name, createdTime:toTime(createdTime), expires:toTime(expires)
                            }
                        });
                    })
                }
            }
        },
        {
            method: 'PATCH',
            path: '/accessKeys/{key?}',
            config: {
                handler(request, reply){
                    const {auth:{credentials:{email, name}}, payload, params:{key}} = request;
                    updateAccessKey(Object.assign({}, payload, {email, key}), (e, accessKey)=> {
                        if (e) return reply(e);
                        const {createdBy, friendlyName, description, createdTime, expires} = accessKey;
                        reply({
                            accessKey: {
                                createdBy,
                                friendlyName,
                                description,
                                name:`(hidden)`,
                                createdTime: toTime(createdTime),
                                expires: toTime(expires)
                            }
                        });
                    });
                }
            }
        },
        {
            method: 'GET',
            path: '/accessKeys',
            config: {
                handler(request, reply){
                    const {email, name} = request.auth.credentials;
                    listAccessKeys(email, (e, accessKeys)=> {
                        if (e) return reply(e);
                        reply({
                            accessKeys: accessKeys.map(v=> {
                                const {createdTime, createdBy, expires, friendlyName, description, id}= v;

                                const ret = {
                                    name:`(hidden)`,
                                    createdTime: toTime(createdTime),
                                    createdBy,
                                    expires: toTime(expires),
                                    friendlyName,
                                    description,
                                    id
                                };
                                if (name === v.name) {
                                    ret.isSession = true;
                                }
                                return ret;
                            })
                        });
                    });
                }
            }
        },
        {
            method: 'DELETE',
            path: '/accessKeys/{key}',
            config: {
                handler(request, reply){
                    const {auth:{credentials:{email}}, params:{key}} = request;
                    removeAccessKey({email, key}, (e, o)=> {
                        if (e) return reply(e);
                        reply().code(204)
                    });
                }
            }
        }
    ]);
});
const toTime = (value)=> {
    if (!value) return value;
    if (typeof value === 'string') {
        return new Date(value).getTime();
    }
    if (value instanceof Date) {
        return value.getTime();
    }
    return value;

};
module.exports = {register};
