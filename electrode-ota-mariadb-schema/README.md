# bento-ota-db
This is the MariaDB-based Cloud RDBMS database that supports the Electrode Over-The-Air update server.

## Background
This is a liquibase project created in Eclipse using the Maven project type.

### Files
```src/assembly/dbaas-assembly.xml``` :  packaging instructions for the build; referenced in pom.xml

```src/assembly/main/resources/db```
- ```dbaascode.xml``` : used by DBEvolver for proper mapping
- ```./mysql/base/*``` : database creation script
- ```./mysql/schema-user/*``` : creates users for db
- ```./mysql/tables/*``` : table definitions

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

You can also just run docker to bring the db up and have liquibase run the change set.

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

