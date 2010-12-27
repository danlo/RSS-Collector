#!/bin/sh
find . -type f -name \*.js | grep -v .git | grep -v config.js |  xargs -t -n 1 jslint
