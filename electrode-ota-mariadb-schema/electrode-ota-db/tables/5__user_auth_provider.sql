--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mariadb
CREATE TABLE user_auth_provider (
	user_id MEDIUMINT UNSIGNED NOT NULL,
	provider VARCHAR(64) NOT NULL,
	
	CONSTRAINT PRIMARY KEY (user_id, provider),
	CONSTRAINT fk_user_provider FOREIGN KEY (user_id) REFERENCES user (id)
);
