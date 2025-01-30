#!/bin/bash

git pull
yarn
yarn build
yarn prod:restart