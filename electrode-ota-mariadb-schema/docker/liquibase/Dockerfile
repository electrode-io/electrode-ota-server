FROM webdevops/liquibase:mysql


ENTRYPOINT ["/common/wait-for-it.sh", "-t", "30", "ota-db:3306", "--", "/entrypoint"]
