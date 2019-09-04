# Electrode OTA Server

The Electrode OTA Server provides a way to hot deploy android and ios React Native&#8482; and Cordova&#8482; apps. The server
is API compatible with [code-push-cli](https://microsoft.github.io/code-push/docs/cli.html), the
[Code Push React Native SDK](https://microsoft.github.io/code-push/docs/react-native.html) and the [Code Push Cordova SDK](https://microsoft.github.io/code-push/docs/cordova.html).

[Documentation](https://docs.electrode.io/other/powerful-electrode-tools/react-native-and-over-the-air)

## Requirements

- Node ^6.6.0



![OTA: Overview](./docs/img/OV1.png)

## Installation

For configuration instructions visit the [electrode.io](http://www.electrode.io/docs/electrode_react_native_over_the_air_electron.html)

```
 npm i electrode-ota-server
```

## Example

Check the `example` folder.  See the [Readme](example/README.md)


## Releases
### Version 4.3.0

Various bug fixes.

### Version 4.0.0

Rewrite of mariadb module; simplify needed configuration to use the mariadb module.

```json
        "electrode-ota-server-dao-plugin" : {
            "module" : "electrode-ota-server-dao-mariadb",
            "options": {
                "clusterConfig" : {
                    "canRetry" : true,
                    "defaultSelector" : "ORDER",
                    "removeNodeErrorCount" : 5,
                    "restoreNodeTimeout" : 0,
                },
                "poolConfigs" : [{
                    "database": "electrode_ota",
                    "host": "localhost",
                    "password": "ota",
                    "port": 33060,
                    "user": "ota",
                }],
            }
        },
```

The underlying implementation uses the npm module [mysql](https://www.npmjs.com/package/mysql). The options are described in further detail in the module's [readme](./electrode-ota-server-dao-mariadb/README.md).

The schema for mariadb is in the [electrode-ota-mariadb-schema folder](./electrode-ota-mariadb-schema/README.md). The module does not use sequelize anymore, and the schema is created separately using liquibase.


### Version 3.2.1

Version 3.2.1 is deprecated. Please use Version 3.3.0 instead.

### Version 2

Version 2 adds partial update support. To do this it requires some alterations to the cassandra database. This
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

## Development

To run tests, make sure you have `localhost.walmart.com` mapped to 127.0.0.1 loopback.
Make sure you have cassandra installed. Cassandra is required for testings.

```sh
> docker pull cassandra
> docker run -p 9042:9042 cassandra
```

To build..

```
> npm install -g lerna yarn
> lerna bootstrap
```

To run all tests (will rebuilds all) ..

```
> yarn test
```

To run a package test...

```
> cd electrode-ota-model-app
> yarn test
```

To run a sample app, check the example app in the example folder.

## Packages

| Package | Description |
| :------ | :---------- |
| electrode-ota-mariadb-schema | Schema for MariaDB |
| electrode-ota-server | Main server module |
| electrode-ota-server-auth | Contains all the authentication strategies. |
| electrode-ota-server-auth-basic | Provides basic authentication |
| electrode-ota-server-auth-github | Provides Github-based authentication |
| electrode-ota-server-auth-validate | Provides session support |
| electrode-ota-server-boot | Server startup module |
| electrode-ota-server-dao-cassandra | Implementation of `electrode-ota-server-dao-plugin` that supports Cassandra |
| electrode-ota-server-dao-mariadb | Implementation of `electrode-ota-server-dao-plugin` that supports MariaDB / MySQL |
| electrode-ota-server-dao-plugin | Defines the interface for the backend datastore(s) |
| electrode-ota-server-default-config | Default config |
| electrode-ota-server-diregister | Utility for registering various modules |
| electrode-ota-server-errors | Common errors (@hapi/boom wrapper) |
| electrode-ota-server-fileservice-download | Handles download of packages |
| electrode-ota-server-fileservice-upload | Handles upload of packages|
| electrode-ota-server-logger | Logger |
| electrode-ota-server-manager | Route handlers for /manager/* endpoints |
| electrode-ota-server-model-account | Account model |
| electrode-ota-server-model-acquisition | Acquisition model |
| electrode-ota-server-model-app | App model |
| electrode-ota-server-model-manifest | Manifest model |
| electrode-ota-server-model-weighted | Weighting utility |
| electrode-ota-server-public | Route handler for static endpoints |
| electrode-ota-server-routes-accesskeys | Route handler for access keys endpoints |
| electrode-ota-server-routes-acquisition | Route handler for (client) acquisition endpoints |
| electrode-ota-server-routes-apps | Route handler for app endpoints |
| electrode-ota-server-routes-auth | Route handelr for authentication/session endpoints |
| electrode-ota-server-service-errors | Handles endpoint errors |
| electrode-ota-server-service-fileservice | Deprecated |
| electrode-ota-server-service-management | Deprecated |
| electrode-ota-server-test-support | Test utilities |
| electrode-ota-server-util | Utilities |
| electrode-ota-server-util-dev | Developer utilities |
| electrode-ota-server-view | Deprecated |
| electrode-ota-ui | OTA UI shared with desktop/web UIs |

### Custom Data store

`electrode-ota-server-dao-plugin` defines the interface for the database, along with the expected Data Access Objects.  

To create your own data store, create a module with the same factory methods as `electrode-ota-server-dao-plugin`.  See `electrode-ota-server-dao-cassandra` and `electrode-ota-server-dao-mariadb` for examples.

In your config file, specify the new module.  Pass any required options.
```json
    "electrode-ota-server-dao-plugin" : {
        "module" : "electrode-ota-server-dao-mariadb",
        "options": {
            ...
        }
    },
```

Package content is saved to the specified datastore (MariaDB or Cassandra).  If you want to save to disk, override `electrode-ota-server-fileservice-download` and `electrode-ota-server-fileservice-upload` with your custom module.
```json
    "electrode-ota-server-fileservice-upload": {
        "module": "my-object-store",
        "options": { "upload": true }
    },
    "electrode-ota-server-fileservice-download": {
        "module": "my-object-store",
        "options": { "upload": false }
    }
```


## HowTos

#### Upload Size and Timeout

To increase the max upload size, add this to your configuration:
Likewise, you can set the timeout if upload is timing out.

```json
"electrode-ota-server-routes-apps" : {
    "options" : {
        "payload" : {
            "maxBytes" : 94371840,
            "timeout": 119999
        }
    }
}
```

#### Change log level
Update the log level in the options of electrode-ota-server-logger

```json
{
    "plugins": {
        "electrode-ota-server-logger": {
            "options": {
                "level": "info"
            }
        }
    }
}
```

#### Add a new package

Use Lerna to create the package

```sh
% lerna create <package-name>
```

This creates a base project.  Update `package.json` to match other projects.

Apache-2.0 © WalmartLabs
<br>
Built with :heart: by [Team Electrode](https://github.com/orgs/electrode-io/people) @WalmartLabs.
