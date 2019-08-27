--liquibase formatted sql

--changeset d0v0033:electrode_ota_db_0_0_12 dbms:mariadb
CREATE TABLE metrics_summary (
  deployment_id MEDIUMINT UNSIGNED NOT NULL,
  last_run_time DATETIME(3),
  lock_by VARCHAR(64),
  lock_time DATETIME(3),
  summary_json LONGTEXT,

  INDEX idx_run_and_lock_metric_summary (last_run_time, lock_time),
  CONSTRAINT fk_deployment_id_metric_summary FOREIGN KEY (deployment_id) REFERENCES deployment (id)
);