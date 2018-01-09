Electrode OTA Server
===
The Electrode OTA Server provides a way to hot deploy android and ios React Native&#8482;  and Cordova&#8482;  apps.   The server
is API compatible with [code-push-cli](https://microsoft.github.io/code-push/docs/cli.html), the
[Code Push React Native SDK](https://microsoft.github.io/code-push/docs/react-native.html) and the [Code Push Cordova SDK](https://microsoft.github.io/code-push/docs/cordova.html).


## Upgrade

### Version 3.2.1
Version 3.2.1 adds support for MySQL/MariaDB.  To use, enable `logger`, `dao-factory`, `dao-mariadb`, and disable `dao-plugin` and `dao-cassandra`.  Connection settings can be specified under `dao-mariadb`.
```json
    "electrode-ota-server-logger": {
      priority: 1
    },
    "electrode-ota-server-dao-factory": {
      priority: 5
    },
    "electrode-ota-server-dao-mariadb": {
      priority: 4,
      options: {
        host: "127.0.0.1",
        port: 3306,
        dialect: "mysql",
        db: "ota_db",
        user: "root",
        password: ""
      }
    },
    "electrode-ota-server-dao-plugin": {
      enable: false
    },
    "electrode-ota-server-dao-cassandra": {
      enable: false
    },
```

### Version 2
Version 2 adds partial update support.  To do this it requires some alterations to the cassandra database.  This
will happen automatically, unless the configuration to the electrode-ota-dao-cassandra is configured as
```json

 "electrode-ota-server-dao-cassandra": {
                "options": {
                    ...
                    "disableTTYConfirmation": false,
                    //this is alter by default.
                    "migration": "safe",
                }
            }
 }

```
Make sure to backup your data, while not known to cause data loss, it is possible.


![OTA: Overview](./docs/img/OV1.png)

## Installation
For configuration instructions visit the [electrode.io](http://www.electrode.io/docs/electrode_react_native_over_the_air_electron.html)


```
 npm i electrode-ota-server
```

## Upload Size
To increase the max upload size, add this to your configuration:
```json

"electrode-ota-server-routes-apps" : {
            options : {
                payload : {
                    maxBytes : 94371840
                }                
            }
        }

```

## Development

To run tests, make sure you have `localhost.walmart.com` mapped to 127.0.0.1 loopback.
To build..
```
> lerna bootstrap
```
To run test..
```
> yarn test
```

Apache-2.0 © WalmartLabs
<br>
Built with :heart: by [Team Electrode](https://github.com/orgs/electrode-io/people) @WalmartLabs.
