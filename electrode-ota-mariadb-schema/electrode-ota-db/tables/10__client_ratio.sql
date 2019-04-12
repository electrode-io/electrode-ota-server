--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE client_ratio (
	client_unique_id VARCHAR(128) NOT NULL,
	package_id MEDIUMINT UNSIGNED NOT NULL,
	create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
	ratio FLOAT UNSIGNED NOT NULL,
	is_updated BOOLEAN NOT NULL,
	
	CONSTRAINT PRIMARY KEY (client_unique_id, package_id),
	CONSTRAINT fk_package_id_client_ratio FOREIGN KEY (package_id) REFERENCES package (id)
);