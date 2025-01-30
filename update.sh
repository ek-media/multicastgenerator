#!/bin/bash

cd /root/multicastgenerator

BRANCH="main"
git remote update
LAST_UPDATE=`git show --no-notes --format=format:"%H" $BRANCH | head -n 1`
LAST_COMMIT=`git show --no-notes --format=format:"%H" origin/$BRANCH | head -n 1`

if [ $LAST_COMMIT != $LAST_UPDATE ]; then
    echo "Updating application"
    git pull --no-edit
    yarn
    yarn build
    yarn prod:restart
else
    echo "No updates available"
fi