--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE access_key (
	id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	user_id MEDIUMINT UNSIGNED NOT NULL,
	name VARCHAR(128) NOT NULL UNIQUE KEY,
	create_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP,
	created_by VARCHAR(128),
	expires DATETIME(3) NOT NULL,
	last_access DATETIME(3),
	friendly_name VARCHAR(128),
	description VARCHAR(256),
	
	INDEX idx_access_key_by_user_id (user_id),
	CONSTRAINT fk_user_access_key FOREIGN KEY (user_id) REFERENCES user (id)
);