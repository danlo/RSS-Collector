#!/bin/sh
sh jslint.sh

node index.js historian &
sleep 1
curl http://127.0.0.1:8124/
wait
