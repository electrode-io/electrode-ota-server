--liquibase formatted sql

--changeset awhelms:electrode_ota_db_0_0_1 dbms:mysql
CREATE TABLE app_permission (
	app_id MEDIUMINT UNSIGNED,
	user_id MEDIUMINT UNSIGNED,
	permission VARCHAR(32) NOT NULL,
	
	PRIMARY KEY (user_id, app_id),
	CONSTRAINT fk_collaborator_app FOREIGN KEY (app_id) REFERENCES app (id),
	CONSTRAINT fk_collaborator_user FOREIGN KEY (user_id) REFERENCES user (id)
);