import path from 'path';
const root = path.join.bind(path, __dirname, '..');
const dao = process.env.DAO || 'cassandra';
const _resolve = function (mod, lib) {

    const libResolve = require.resolve(mod);
    const ret = !lib ? libResolve : path.join(libResolve, '..', lib);
    return ret;
};

export default function () {

    return {
        "app": {
            "electrode": true
        },
        "connections": {
            "default": {
                "port": process.env.port || process.env.PORT || 9001,
                "routes": {

                    "cors": {
                        "origin": [
                            "*"
                        ],
                        "credentials": true,
                        "exposedHeaders": [
                            "content-type",
                            "content-length"
                        ],
                        "maxAge": 600,

                        "headers": [
                            "Accept",
                            "Content-Type",
                            "Authorization",
                            "X-Codepush-SDK-Version",
                        ]
                    }
                }
            }

        },
        "routes": {
            "files": {
                "relativeTo": root('server')
            }
        },
        "plugins": {
            "inert": {
                "enable": true
            },
            "electrode-ota-view": {
                "module": "vision"
            },
            "electrode-ota-server-dao-cassandra": {
                "module": _resolve(`electrode-ota-server-dao-${dao}`, 'cassandra'),
                "options": {
                    "contactPoints": [
                        "localhost"
                    ],
                    "keyspace": "wm_ota"
                }
            },
            "electrode-ota-server-dao-plugin": {
                "module": _resolve(`electrode-ota-server-dao-${dao}`, 'plugin')
            },
            "electrode-ota-server-fileservice-upload": {},
            "electrode-ota-server-fileservice-download": {},
            "electrode-ota-server-fileservice": {
                "module": "electrode-ota-server-service-fileservice"
            },
            "electrode-ota-server-model-manifest": {},
            "electrode-ota-server-model-weighted": {},
            "electrode-ota-server-model-app": {},
            "electrode-ota-server-model-account": {},
            "electrode-ota-server-model-acquisition": {},

            "electrode-ota-server-auth-validate": {
                "options": {}
            },
            "electrode-ota-server-auth": {
                "options": {
                    "default": {
                        "strategies": [
                            "bearer"
                        ],
                        "mode": "required"
                    },
                    "strategy": {
                        "github-oauth": {
                            "module": "bell",
                            "options": {
                                "provider": "github",
                                "isSecure": true,
                                "scope": [
                                    "user:email"
                                ]
                            }
                        },
                        "bearer": {
                            "module": "hapi-auth-bearer-token",
                            "scheme": "bearer-access-token",
                            "validate": "token",
                            "options": {
                                "allowQueryToken": true,
                                "allowMultipleHeaders": false,
                                "accessTokenName": "access_token"
                            }
                        },
                        "session": {
                            "scheme": "cookie",
                            "module": "hapi-auth-cookie",
                            "validate": "session",
                            "options": {
                                "cookie": "wm-ota-auth",
                                "isSecure": true,
                                "redirectTo": "/auth/login"
                            }
                        }
                    }
                }
            },
            "electrode-ota-server-routes-accesskeys": {},
            "electrode-ota-server-routes-apps": {},
            "electrode-ota-server-routes-acquisition": {},
            "electrode-ota-server-routes-auth": {
                "options": {
                    "providers": [
                        {
                            "name": "github",
                            "auth": "github-oauth",
                            "label": "GitHub",
                            "icon": {
                                "src": "https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png",
                                "height": 50,
                                "width": 50
                            }
                        }
                    ]
                }
            },
            "electrode-ota-server-public": {
                "options": {
                    "method": "GET",
                    "path": "/assets/{param*}",
                    "config": {
                        "auth": false,
                        "handler": {
                            "directory": {
                                "path": root("server", "public")
                            }
                        }
                    }
                }
            },
            "electrode-ota-server-service-errors": {}
        }
    };
};