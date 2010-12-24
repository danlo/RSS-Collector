#!/bin/sh
find . -type f -name \*.js | grep -v .git | xargs -t -n 1 jslint 
