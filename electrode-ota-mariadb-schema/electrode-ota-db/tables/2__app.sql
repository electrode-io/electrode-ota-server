--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE app (
	id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(256) NOT NULL UNIQUE KEY
);