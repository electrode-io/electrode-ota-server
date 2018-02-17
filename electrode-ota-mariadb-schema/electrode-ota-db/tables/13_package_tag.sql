--liquibase formatted sql

--changeset djergin:electrode_ota_db_0_0_1 dbms:mysql
CREATE TABLE package_tag (
    id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(256) NOT NULL,
    deployment_id MEDIUMINT UNSIGNED NOT NULL,
    package_id MEDIUMINT UNSIGNED NOT NULL,
    create_time DATETIME(3) DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_deployment_package_tag(deployment_id,package_id,tag_name),

    CONSTRAINT fk_deployment_id_pkg_tags FOREIGN KEY (deployment_id) REFERENCES deployment (id),
    CONSTRAINT fk_package_id_pkg_tags FOREIGN KEY (package_id) REFERENCES package (id) 
);

--changeset awhelms:electrode_ota_db_0_0_10 dbms:mysql
ALTER TABLE package_tag DROP FOREIGN KEY fk_deployment_id_pkg_tags;
ALTER TABLE package_tag DROP INDEX idx_deployment_package_tag;
ALTER TABLE package_tag DROP COLUMN deployment_id;
ALTER TABLE package_tag ADD INDEX idx_package_tag(package_id, tag_name);