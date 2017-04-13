
electrode-ota-server-auth-ldap
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.




## Install
```
$ npm install electrode-ota-server-auth-ldap --save
```

## Usage
To configure LDAP you need this plugin and to add to your config.   Because of the difference between oauth and ldap,
we use http basic to capture client credentials.

```json
 {
    "plugins": {
        "electrode-ota-server-auth-validate": {
            "module":"electrode-ota-server-auth-ldap/lib/validate",
            "options": {
                "url": "ldap://<your_ldap_server>:<port>",
                "timeout": 50000,
                "defaultNS": "<AD_IF_EXISTS>",
                "defaultSearch": "<DEFAULT_SERACH",
                "connectTimeout": 100000
            }
        },
     
        "electrode-ota-server-auth": {
            "options": {
                "strategy": {
                    "github-oauth": {
                        "enable": false
                    },
                    
                    "basic": {
                        "module":"electrode-ota-server-auth-basic",
                        "scheme": "basic",
                        "validate": "ldap",
                        "options": {
                            "realm": "<YOUR_REALM>"
                        }
                    }
                }
            }
        },
        "electrode-ota-server-routes-auth": {
            "options": {
                "providers": [
                    {
                        "name": "<your provider>",
                        "auth": "basic",
                        "label": "<LABEL_FOR_ICON>",
                        "icon": {
                            "src": "<ICON_URL_OR_DATA_URL",
                            "height": 50,
                            "width": 50
                        }
                    }
                ]
            }
        }
    }
}
```