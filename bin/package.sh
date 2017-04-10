#!/usr/bin/env bash
help(){
  [ -n $1 ] && echo "ERROR: $1"
  echo "package.sh <packagename>"
  exit 1;
}

valid_name() {
  [ -d $1 ] &&   help "directory already exists $1"
   echo $1 | grep -q '^electrode-ota-server-'
}

valid_name $1

mkdir $1
cd $1

(
cat <<EOF
{
  "name": "${PKG}",
  "version": "1.0.0",
  "main": "dist/index.js",
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
mkdir src
mkdir test
git add ../$PKG
