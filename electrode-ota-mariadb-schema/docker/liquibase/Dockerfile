FROM webdevops/liquibase:mysql


ENTRYPOINT ["/common/wait-for-it.sh", "ota-db:3306", "--", "/entrypoint"]
