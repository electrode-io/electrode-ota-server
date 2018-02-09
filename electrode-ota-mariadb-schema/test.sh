#!/bin/bash

docker-compose build
rc=$?

if [ $rc -ne 0 ]
then
    echo "build failed!"
    exit $rc
fi


docker-compose up -d
rc=$?

if [ $rc -ne 0 ]
then
    echo "failed to start container!"
    exit $rc
fi

docker-compose exec ota-db /common/wait-for-it.sh ota-db:3306
rc=$?

if [ $rc -ne 0 ]
then
    echo "failed waiting for db to startup!"
    exit $rc
fi

docker-compose exec ota-db /tests/run-tests.sh
rc=$?

if [ $rc -ne 0 ]
then
    echo "tests failed!"
fi

docker-compose down
echo "done"
exit $rc