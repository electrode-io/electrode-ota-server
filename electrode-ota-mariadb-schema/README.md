# electrode-ota-mariadb-schema
This is a MariaDB database that can support the Electrode Over-The-Air update server.

## Background
This is a set of xml and sql files intended to be used with [liquibase](http://www.liquibase.org/index.html), but they can also be used independently.

### Files
- ```./docker/*``` : files to support running mariadb and liquibase in docker
- ```./electrode-ota-db/tables/*``` : table definitions
- ```./sql-tests/*``` : files to support a quick smoke test for the tables after creation

More info on the tables can be found [here](tables.md)

## Usage

#### Local testing

Tests are performed using docker containers.  You will need to install docker.

Once you have docker installed, if you are on a Mac or other Linux-based OS, you can run the test.sh script.

*Make sure you are in the `electrode-ota-mariadb-schema` folder when executing the commands listed below.*

```
test.sh
```

This will
- perform the docker build
- start up the docker container
  - starts the db
  - runs liquibase update
- wait for the db to be available
- run sql-tests/cleanup.sql
- run sql-tests/tests.sql
- stop the docker container

The following files must have execute permissions
- ./test.sh
- ./docker/common/wait-for-it.sh
- ./sql-tests/run-tests.sh


To bring up a running DB, run the DB in docker and have liquibase run the change set.

```
docker-compose up -d
```

You should see output like

```
ota-db_1     | Version: '10.3.1-MariaDB-10.3.1+maria~jessie'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  mariadb.org binary distribution
liquibase_1  | wait-for-it.sh: ota-db:3306 is available after 1 seconds
ota-db_1     | 2017-09-26 19:30:38 9 [ERROR] InnoDB: Table `mysql`.`innodb_table_stats` not found.
liquibase_1  | Liquibase Update Successful
bentootadb_liquibase_1 exited with code 0
```

The db will be available on your local system on port 33060.  The docker settings are in docker-compose.yml.

#### Recreating the database
```sh
% cd electrode-ota-mariadb-schema
% docker-compose run liquibase dropAll
% docker-compose run liquibase update
```

## FAQ
- `POOL_NOEXIST` errors
This occurs when connectivity with MariaDB is lost or intermittent.  When all connections are lost, the connection pool also dies.  To have the connection pool retry, make sure `restoreNodeTimeout` cluster config is > 0.
```js
        clusterConfig: {
          restoreNodeTimeout: 500
        },
```
