#!/usr/bin/env bash
help(){
  [ -n "$1" ] && echo "ERROR: $*"
  echo "package.sh <packagename>"
  exit 1;
}

valid_name() {
  [ -d "$1" ] && help "directory already exists $1"
   echo $1 | grep -q '^electrode-ota-server-'
}

PKG=$1
valid_name $PKG

mkdir $PKG
cd $PKG

(
cat <<EOF
{
  "name": "${PKG}",
  "version": "1.0.0",
  "main": "lib/index.js",
  "scripts": {
    "test": "ota-mocha",
    "build": "ota-babel",
    "coverage": "ota-nyc",
    "prepublish": "npm run build"
  },
  "dependencies": {
    "electrode-ota-server-diregister":"1.0.0",
    "electrode-ota-server-util":"1.0.0"
  },
  "devDependencies": {
    "electrode-ota-server-util-dev":"1.0.0"
  }
}
EOF
)>package.json

mkdirp src
mkdirp test

git add ../$PKG
