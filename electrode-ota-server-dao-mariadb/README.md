# electrode-ota-server-dao-mariadb
An implementation of the Electrode OTA Server's data access layer using MariaDB as a back-end.

## Usage
In your electrode ota server implementation, include this module as a dependency.

```
npm install --save electrode-ota-server-dao-mariadb
```

Update your OTA server configuration to override the DAO plugin.  *This is assuming your config is in JavaScript format (not JSON).*

```JavaScript
const conf = {
    plugins : {
        // ...

        "electrode-ota-server-dao-plugin" : {
            module : "electrode-ota-server-dao-mariadb",
            // connection options based on typeorm;
            // 'type' and 'entities' are defaulted but may be overriden
            options : {
                clusterConfig : {
                    canRetry : true,
                    defaultSelector : "ORDER",
                    removeNodeErrorCount : 5,
                    restoreNodeTimeout : 0,
                },
                poolConfigs : [{
                    database: "bento_ota",
                    host: "localhost",
                    password: "password",
                    port: 3306,
                    user: "user",
                }],
            }
        },

        // ...
    }
}
```

The ```clusterConfig``` is the settings for the mysql [PoolCluster options](https://github.com/mysqljs/mysql#poolcluster-options).

The ```poolConfigs``` property is an array of [Connection options](https://github.com/mysqljs/mysql#connection-options).

The database schema can be found at [electrode-ota-mariadb-schema](https://github.com/electrode-io/electrode-ota-server/tree/master/electrode-ota-mariadb-schema)

# To run tests
Start docker MariaDB in `electrode-ota-mariadb-schema`
```js
% docker-compose up ota-db
```

Run tests in this directory
```js
% yarn test
```

Run build (compiles typescript)
```js
% yarn build
```