electrode-ota-server-dao-mariadb
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

## Install
```
% npm install electrode-ota-server-dao-mariadb
```

## Usage
Specify connection information in the config options.
Reference sequelizejs for config parameters.
```
"plugins": {
    "electrode-ota-server-dao-mariadb": {
        "config": {
            "host": "localhost",
            "port": 3306,
            "db": "example",
            "user": "root",
            "password": ""
        }
    }
}
```

Use this driver in DAO factory
```
"plugins": {
    "electrode-ota-server-dao-factory": {
        driver: "electrode-ota-server-dao-mariadb"
    }
}
```
