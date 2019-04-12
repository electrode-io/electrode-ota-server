--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE package_diff (
	left_package_id MEDIUMINT UNSIGNED NOT NULL,
	right_package_id MEDIUMINT UNSIGNED NOT NULL,
	size MEDIUMINT UNSIGNED NOT NULL,
	url VARCHAR(256) NOT NULL,
	
	CONSTRAINT PRIMARY KEY (left_package_id, right_package_id),
	CONSTRAINT fk_left_package_diff FOREIGN KEY (left_package_id) REFERENCES package (id),
	CONSTRAINT fk_right_package_idff FOREIGN KEY (left_package_id) REFERENCES package (id)
);

--changeset awhelms:electrode_ota_db_0_0_5 dbms:mariadb
ALTER TABLE package_diff MODIFY COLUMN size BIGINT UNSIGNED;
