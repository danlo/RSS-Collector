#!/bin/sh
clear
echo "---- jslint"
sh jslint.sh
sleep 3

echo "---- nodeunit test"
nodeunit test
sleep 3

echo "---- basic test"
node index.js historian &
sleep 1
curl http://127.0.0.1:8124/
wait
