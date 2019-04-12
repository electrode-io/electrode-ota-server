--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE deployment_package_history (
	deployment_id MEDIUMINT UNSIGNED NOT NULL,
	package_id MEDIUMINT UNSIGNED NOT NULL,
	
	CONSTRAINT PRIMARY KEY (deployment_id, package_id),
	CONSTRAINT fk_deployment_id_pkg_hist FOREIGN KEY (deployment_id) REFERENCES deployment (id),
	CONSTRAINT fk_package_id_dpl_hist FOREIGN KEY (package_id) REFERENCES package (id)
);

--changeset awhelms:electrode_ota_db_0_0_4 dbms:mariadb
ALTER TABLE deployment_package_history ADD COLUMN create_time DATETIME DEFAULT CURRENT_TIMESTAMP;