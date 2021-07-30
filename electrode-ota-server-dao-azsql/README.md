# electrode-ota-server-dao-azsql
An implementation of the Electrode OTA Server's data access layer using AzureSQL as a back-end.

## Usage
In your electrode ota server implementation, include this module as a dependency.

```
npm install --save electrode-ota-server-dao-azsql
```

Update your OTA server configuration to override the DAO plugin.  *This is assuming your config is in JavaScript format (not JSON).*

```JavaScript
const conf = {
    plugins : {
        // ...

        "electrode-ota-server-dao-plugin" : {
            module : "electrode-ota-server-dao-azsql",
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
                    database: "ota_db",
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
