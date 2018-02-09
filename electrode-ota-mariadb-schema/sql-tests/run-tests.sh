#!/bin/bash

CLEANUP=/tests/cleanup.sql
TESTS=/tests/tests.sql

echo "executing cleanup sql"
mysql --user=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${MYSQL_DATABASE} < ${CLEANUP}
rc=$?

if [ $rc -ne 0 ]
then
    echo "error during cleanup; exiting"
    exit $rc
fi

echo "executing tests"
mysql --user=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${MYSQL_DATABASE} < ${TESTS}
rc=$?

if [ $rc -ne 0 ]
then
    echo "error executing tests!"
fi
exit $rc