--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mysql
CREATE TABLE metric (
	deployment_id MEDIUMINT UNSIGNED NOT NULL,
	app_version VARCHAR(64) NOT NULL,
	client_unique_id VARCHAR(128) NOT NULL,
	label VARCHAR(64) NOT NULL,
	previous_deployment_key VARCHAR(128),
	previous_label_or_app_version VARCHAR(64),
	status VARCHAR(64),
	
	INDEX idx_metric_deployment_id (deployment_id)
);

--changeset awhelms:electrode_ota_db_0_0_6 dbms:mysql
ALTER TABLE metric ADD COLUMN create_time DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE metric ADD INDEX idx_metric_create_time (create_time);

--changeset awhelms:electrode_ota_db_0_0_8 dbms:mysql
ALTER TABLE metric MODIFY COLUMN app_version VARCHAR(64);
ALTER TABLE metric MODIFY COLUMN label VARCHAR(64);

ALTER TABLE metric ADD INDEX idx_metric_status (status);