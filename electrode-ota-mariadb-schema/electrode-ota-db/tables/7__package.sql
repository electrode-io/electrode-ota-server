--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mysql
CREATE TABLE package (
	id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	app_version VARCHAR(64) NOT NULL,
	blob_url VARCHAR(256) NOT NULL,
	create_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP,
	description VARCHAR(256),
	is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
	is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
	label VARCHAR(64) NOT NULL,
	manifest_blob_url VARCHAR(256) NOT NULL,
	original_deployment_key VARCHAR(128) NULL, 
	original_label VARCHAR(64) NULL,
	package_hash VARCHAR(128) NOT NULL,
	release_method VARCHAR(32) NOT NULL DEFAULT 'Upload',
	released_by VARCHAR(128) NOT NULL,
	rollout TINYINT,
	size MEDIUMINT,
	upload_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP,
	
	CONSTRAINT fk_orig_deployment_for_package FOREIGN KEY (original_deployment_key) REFERENCES deployment (deployment_key)
);

--changeset awhelms:electrode_ota_db_0_0_3 dbms:mysql
ALTER TABLE package MODIFY COLUMN size BIGINT UNSIGNED;

--changeset awhelms:electrode_ota_db_0_0_7 dbms:mysql
ALTER TABLE package ADD INDEX idx_package_hash (package_hash);
ALTER TABLE package DROP FOREIGN KEY fk_orig_deployment_for_package;
ALTER TABLE package CHANGE COLUMN original_deployment_key original_deployment_name VARCHAR(128) NULL;

--changeset awhelms:electrode_ota_db_0_0_11 dbms:mysql
ALTER TABLE package ADD COLUMN update_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP;