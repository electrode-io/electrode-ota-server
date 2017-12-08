electrode-ota-server-dao-factory
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used as a standalone module, use at your own risk.

This service provides an abstraction layer for the DAO data store.   It allows for pluggable datastore driver used to power DAO storage.
Currently support datastores are MariaDB (electrode-ota-server-dao-mariadb) and Cassandra (electrode-ota-server-dao-cassandra).

## Install
```
$ npm install electrode-ota-server-dao-factory
```

## Usage

- Install this module in your package.json.
- Update your config to use this package, specify a driver.
- Add the driver and driver options.

In this sample configuration, we are using the MariaDB driver to save DAO instances.
```
{
    "electrode-ota-server-dao-factory": {
        "options": {
            "driver": "electrode-ota-server-dao-mariadb"
        }
    },
    "electrode-ota-server-dao-mariadb": {
        "options": {
            host: '127.0.0.1',
            user: 'root',
            password: 'root'
        }
    }
}