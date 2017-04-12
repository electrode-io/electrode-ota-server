electrode-ota-server-auth-basic
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

## Install
```
$ npm install electrode-ota-server-auth-basic
```

## Usage

Below is the basic configuration.  You will need to configure someway to handle the actual validation.  This shows the prompt.

```json
{
 
 "plugins":{
             ...
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
    }
}

```