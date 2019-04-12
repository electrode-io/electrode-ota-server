--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_2 dbms:mariadb
CREATE TABLE deployment_app (
	deployment_id MEDIUMINT UNSIGNED NOT NULL,
	app_id MEDIUMINT UNSIGNED NOT NULL,
	
	PRIMARY KEY (app_id, deployment_id)
);
