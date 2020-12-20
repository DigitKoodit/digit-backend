#!/bin/sh
set -e

HASH_TARGET=package.json
HASH_FILE=.hash-$HASH_TARGET
HASH=""

if [[ -f $HASH_FILE ]]; then
  HASH=$(head -n 1 $HASH_FILE)
fi

if [[ $(md5sum package.json| cut -d ' ' -f 1) = $HASH ]]; then
  echo "Skip npm install"
else 
  echo "Running npm install"
  npm install --no-optional
  sh docker/generate-checksum-file.sh package.json
fi

node_modules/.bin/pm2-runtime keeper_dev.config.js