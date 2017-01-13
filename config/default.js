var path = require('path');
var root = path.join.bind(path, __dirname, '..');


module.exports = {
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
            "module": root("server/dao/cassandra/cassandra"),
            "options": {
                "contactPoints": [
                    "localhost"
                ],
                "keyspace": "wm_ota"
            }
        },
        "electrode-ota-server-dao-plugin": {
            "module": root("server/dao/cassandra/plugin")
        },
        "electrode-ota-server-fileservice-upload": {
            "module": root("server/fileservice/dao/upload")
        },
        "electrode-ota-server-fileservice-download": {
            "module": root("server/fileservice/dao/download")
        },
        "electrode-ota-server-fileservice": {
            "module": root("server/fileservice/dao")
        },
        "electrode-ota-server-model-manifest": {
            "module": root("server/model/manifest-plugin")
        },
        "electrode-ota-server-model-weighted": {
            "module": root("server/model/weighted-plugin")
        },
        "electrode-ota-server-model-app": {
            "module": root("server/model/app-plugin")
        },
        "electrode-ota-server-model-account": {
            "module": root("server/model/account-plugin")
        },
        "electrode-ota-server-model-acquisition": {
            "module": root("server/model/acquisition-plugin")
        },

        "electrode-ota-server-auth-validate": {
            "module": root("server/auth/validate"),
            "options": {}
        },
        "electrode-ota-server-auth": {
            "module": root("server/auth/scheme"),
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
        "electrode-ota-server-routes-accessKeys": {
            "module": root("server/routes/accessKeys")
        },
        "electrode-ota-server-routes-apps": {
            "module": root("server/routes/apps")
        },
        "electrode-ota-server-routes-acquisition": {
            "module": root("server/routes/acquisition")
        },
        "electrode-ota-server-routes-auth": {
            "module": root("server/routes/auth"),
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
            "module": root("server/routes/static"),
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
        "electrode-ota-server-errors": {
            "module": root("server/errors")
        }
    }
};
