--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE deployment (
	id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	app_id MEDIUMINT UNSIGNED NOT NULL,
	create_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP,
	name VARCHAR(128) NOT NULL,
	deployment_key VARCHAR(128) NOT NULL UNIQUE KEY,
	
	INDEX idx_app_id (app_id),
	CONSTRAINT fk_deployment_app FOREIGN KEY (app_id) REFERENCES app (id)
);

--changeset awhelms:electrode_ota_db_0_0_2 dbms:mariadb
ALTER TABLE deployment DROP FOREIGN KEY fk_deployment_app, DROP INDEX idx_app_id, DROP COLUMN app_id;