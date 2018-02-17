--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mysql
CREATE TABLE user (
	id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(128) NOT NULL UNIQUE KEY,
	create_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP,
	name VARCHAR(128) NULL
);