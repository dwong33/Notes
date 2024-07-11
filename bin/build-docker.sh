#!/usr/bin/env bash

VERSION=`jq -r ".version" package.json`
SERIES=${VERSION:0:4}-latest

if ! [[ $(which tsc) ]]; then
    npm i -g typescript
fi

cat package.json > server-package.json

echo "Compiling typescript..."
tsc

sudo docker build -t zadam/trilium:$VERSION --network host -t zadam/trilium:$SERIES .

if [[ $VERSION != *"beta"* ]]; then
  sudo docker tag zadam/trilium:$VERSION zadam/trilium:latest
fi
