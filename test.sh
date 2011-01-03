#!/bin/sh
clear
echo "---- jslint"
sh jslint.sh
sleep 3

echo "---- flushing redis"
../redis-2.0.4/redis-cli flushall
sleep 2

echo "---- nodeunit test"
FILES=`ls -1 test/*.js`
for FILE in $FILES
do
    nodeunit $FILE
done
sleep 3
