--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_11 dbms:mysql
CREATE TABLE package_content (
    package_hash VARCHAR(128) NOT NULL PRIMARY KEY,
    content LONGBLOB
);