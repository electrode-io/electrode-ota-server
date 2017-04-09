"use strict";
import Joi from 'joi';
import {wrap} from '../util';
import diregister from '../diregister';
const toAppOut = (src) => {
    const app = Object.assign({}, src);
    delete app.id;
    return app;
};
const noContent = (reply) => (e) => {
    if (e) return reply(e);
    reply().code(204);
};

const toColab = (email, src) => {
    const app = Object.assign({}, src);
    const {collaborators = {}} = src;
    app.collaborators = Object.keys(collaborators).reduce((ret, key) => {
        const current = ret[key] = Object.assign({}, collaborators[key]);
        if (key === email) {
            current.isCurrentAccount = true;
        }
        return ret;
    }, {});
    return app;
};

const toAppColab = (email) => (app) => toColab(email, toAppOut(app));
const PARAMS = {
    app: {
        app: Joi.string().required(true)
    },
    deployment: {
        app: Joi.string().required(true),
        deployment: Joi.string().required(true)
    }
};

export const register = diregister({
    name: 'appsRoute',
    dependencies: ['electrode:route', 'ota!app', 'ota!scheme']
}, (options, route, app) => {
    const {
        createApp,
        findApp,
        listApps,
        renameApp,
        transferApp,
        removeApp,

        rollback,
        getDeployment,
        promoteDeployment,
        removeDeployment,
        addDeployment,
        renameDeployment,
        updateDeployment,
        listDeployments,

        addCollaborator,
        removeCollaborator,

        upload,

        clearHistory,
        historyDeployment,

        metrics

    } = wrap(app);

    route([
        {
            method: 'POST',
            path: '/apps/{app}/deployments/{deployment}/release',
            config: {
                validate: {
                    params: PARAMS.deployment
                },
                handler(request, reply)
                {
                    const {
                        params: {app, deployment}, auth: {credentials: {email}},
                        server: {app: {config: {app: {downloadUrl = request.server.info.uri + '/storagev2/'}}}},
                        payload
                    } = request;
                    payload.packageInfo = JSON.parse(payload.packageInfo);
                    upload(Object.assign({}, payload, {email, app, deployment, downloadUrl}), (e, release) => {
                        if (e) return reply(e);
                        return reply({release}).code(201);
                    });
                }
            }
        },
        {
            method: 'PATCH',
            path: '/apps/{app}/deployments/{deployment}/release',
            config: {
                validate: {
                    params: PARAMS.deployment
                },

                handler(request, reply)
                {
                    const {params: {app, deployment}, auth: {credentials: {email}}, payload: {packageInfo}} = request;
                    updateDeployment(Object.assign({email, app, deployment}, packageInfo), (e, release) => {
                        if (e) return reply(e);
                        return reply({release}).code(201);
                    });
                }
            }
        },
        {
            method: 'POST',
            path: '/apps/',
            config: {
                handler(request, reply){
                    const {email} = request.auth.credentials;
                    createApp(Object.assign({}, request.payload, {email}), (e, app) => {
                        if (e) return reply(e);
                        reply(toAppOut(app)).code(201);
                    });
                }
            }
        },
        {
            method: 'GET',
            path: '/apps',
            config: {
                handler(request, reply){
                    listApps(request.auth.credentials, (e, apps) => {
                        if (e) return reply(e);
                        apps = apps.map(toAppColab(request.auth.credentials.email));
                        reply({apps});
                    });
                }
            }
        }, {
            method: 'GET',
            path: '/apps/{app}',
            config: {
                validate: {
                    params: PARAMS.app
                },

                handler(request, reply){
                    const {auth: {credentials: {email}}, params: {app}} = request;
                    findApp({email, app}, (e, app) => {
                        if (e) return reply(e);
                        app = toAppColab(email)(app);
                        reply({app});
                    });
                }
            }
        },
        {
            method: 'PATCH',
            path: '/apps/{app}',
            config: {
                validate: {
                    params: PARAMS.app
                },
                handler(request, reply){
                    const {auth: {credentials: {email}}, params: {app}, payload: {name}} = request;
                    renameApp(Object.assign({}, {email, app, name}), noContent(reply));
                }
            }
        },

        {
            method: 'DELETE',
            path: '/apps/{app}',
            config: {
                validate: {
                    params: PARAMS.app
                },
                handler(request, reply){
                    const {auth: {credentials: {email}}, params: {app}} = request;
                    removeApp({email, app}, noContent(reply));
                }
            }
        },
        {
            method: 'POST',
            path: '/apps/{app}/transfer/{transfer}',
            config: {
                handler(request, reply){
                    const {params: {app, transfer}, auth: {credentials: {email}}} = request;
                    transferApp({app, email, transfer}, (e) => {
                        if (e) return reply(e);
                        reply('Created').code(201);
                    })
                }
            }
        },
        {
            method: 'GET',
            path: '/apps/{app}/deployments/',
            config: {
                handler(request, reply){
                    const {params: {app}, auth: {credentials: {email}}} = request;
                    listDeployments({app, email}, (e, deployments) => {
                        if (e) return reply(e);
                        reply({deployments});
                    });
                }
            }

        },
        {
            method: 'POST',
            path: '/apps/{app}/deployments/',
            config: {
                validate: {
                    params: PARAMS.app,
                    payload: {
                        name: Joi.string().min(3).max(100).required(true)
                    }
                },
                handler(request, reply){
                    const {params: {app}, payload, auth: {credentials: {email}}} = request;
                    addDeployment(Object.assign({}, payload, {app, email})).then(({name, key}) => {
                        reply({
                            deployment: {
                                name,
                                key
                            }
                        }).code(201);
                    }, reply);
                }
            }

        },
        {
            method: 'PATCH',
            path: '/apps/{app}/deployments/{deployment}',
            config: {
                validate: {
                    params: PARAMS.deployment,
                    payload: {
                        name: Joi.string().min(3).max(100).required(true)
                    }
                },
                handler(request, reply){
                    const {params: {app, deployment}, payload: {name}, auth: {credentials: {email}}} = request;
                    renameDeployment({app, deployment, email, name}, noContent(reply));
                }
            }

        },
        {
            method: 'GET',
            path: '/apps/{app}/deployments/{deployment}',
            config: {
                validate: {
                    params: PARAMS.deployment
                },
                handler(request, reply){
                    const {params: {app, deployment}, auth: {credentials: {email}}} = request;

                    getDeployment({app, email, deployment}, (e, deployment) => {
                        if (e) return reply(e);
                        reply({
                            deployment
                        });
                    });
                }
            }

        },
        {
            method: 'DELETE',
            path: '/apps/{app}/deployments/{deployment}',
            config: {
                validate: {
                    params: PARAMS.deployment
                },
                handler(request, reply){
                    const {params: {app, deployment}, auth: {credentials: {email}}} = request;
                    removeDeployment({app, deployment, email}, noContent(reply));
                }
            }

        },
        {
            method: 'DELETE',
            path: '/apps/{app}/deployments/{deployment}/history',
            config: {
                validate: {
                    params: PARAMS.deployment
                },
                handler(request, reply){
                    const {params: {app, deployment}, auth: {credentials: {email}}} = request;
                    clearHistory({app, email, deployment}, noContent(reply));
                }
            }

        }, {
            method: 'GET',
            path: '/apps/{app}/deployments/{deployment}/history',
            config: {
                validate: {
                    params: PARAMS.deployment
                },
                handler(request, reply){
                    const {params: {app, deployment}, auth: {credentials: {email}}} = request;
                    historyDeployment({app, email, deployment}, (e, history) => {
                        if (e) return reply(e);
                        reply({history});
                    });
                }
            }

        },
        {
            method: 'POST',
            path: '/apps/{app}/deployments/{deployment}/promote/{to}',
            config: {
                validate: {
                    params: Object.assign({to: Joi.string()}, PARAMS.deployment)
                },
                handler(request, reply){
                    const {params: {app, deployment, to}, payload: {packageInfo}, auth: {credentials: {email}}} = request;
                    promoteDeployment(Object.assign({}, packageInfo, {app, email, deployment, to}), (e, pkg) => {
                        if (e) return reply(e);
                        return reply({package: pkg}).code(201);
                    });
                }
            }
        },
        {
            method: 'POST',
            path: '/apps/{app}/deployments/{deployment}/rollback/{label?}',
            config: {
                validate: {
                    params: Object.assign({label: Joi.string()}, PARAMS.deployment)
                }

            },
            handler(request, reply)
            {
                const {params: {app, deployment, label}, auth: {credentials: {email}}} = request;
                rollback({app, deployment, label, email}, (e, pkg) => {
                    if (e)return reply(e);
                    reply({package: pkg});
                });
            }

        },
        {
            method: 'GET',
            path: '/apps/{app}/deployments/{deployment}/metrics',
            config: {
                validate: {
                    params: PARAMS.deployment
                }
                ,
                handler(request, reply)
                {
                    const {params: {app, deployment}, auth: {credentials: {email}}} = request;
                    metrics({app, deployment, email}, (e, metrics) => {
                        if (e) {
                            console.log('error in metrics', e);
                            return reply(e);
                        }
                        reply({metrics});
                    })
                }
            }
        }
        ,
        {
            method: 'GET',
            path: '/apps/{app}/collaborators',
            config: {
                handler(request, reply)
                {
                    const {params: {app}, auth: {credentials: {email}}} = request;
                    findApp({app, email}, (e, app) => {
                        if (e) return reply(e);
                        reply({
                            collaborators: Object.keys(app.collaborators).reduce((ret, key) => {
                                if (key === email) {
                                    ret[key] = Object.assign({}, app.collaborators[key], {isCurrentAccount: true});
                                } else {
                                    ret[key] = app.collaborators[key];
                                }

                                return ret;
                            }, {})
                        });
                    });
                }
            }
        }
        ,
        {
            method: 'POST',
            path: '/apps/{app}/collaborators/{collaborator}',
            config: {
                handler(request, reply)
                {
                    const {params: {app, collaborator}, auth: {credentials: {email}}} = request;
                    addCollaborator({email, app, collaborator}, (e, o) => {
                        if (e) return reply(e);
                        reply('Created').code(201);
                    });
                }
            }
        }
        ,
        {
            method: 'DELETE',
            path: '/apps/{app}/collaborators/{collaborator}',
            config: {
                handler(request, reply)
                {
                    const {params: {app, collaborator}, auth: {credentials: {email}}} = request;
                    removeCollaborator({email, app, collaborator}, noContent(reply));
                }
            }
        }
    ]);
});

export default {register};
