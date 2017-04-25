#!/usr/bin/env bash
help(){
  [ -n "$1" ] && echo "ERROR: $*"
  echo "package.sh <packagename>"
  exit 1;
}

valid_name() {
  [ -d "$1" ] && help "directory already exists $1"
   echo $1 | grep -q '^electrode-ota-server'
}
version(){
    [ -n "$1" ] && echo $1
    node -p "require('./lerna.json').version"
}

PKG=$1
valid_name $PKG

VERSION=${VERSION:-$(version $2)}
SHORT_NAME=${PKG/electrode-ota-server-/}

[ ! -d $PKG ] && mkdir $PKG
cd $PKG

if [ ! -f package.json ]; then
(
cat <<EOF
{
  "name": "${PKG}",
  "version": "${VERSION}",
  "main": "lib/index.js",
  "scripts": {
    "test": "ota-mocha",
    "build": "ota-babel",
    "coverage": "ota-nyc",
    "prepublish": "npm run build"
  },
  "dependencies": {
    "electrode-ota-server-diregister":"${VERSION}",
    "electrode-ota-server-util":"${VERSION}"
  },
  "devDependencies": {
    "electrode-ota-server-util-dev":"${VERSION}"
  }
}
EOF
)>package.json
fi

[ ! -d src ] && mkdir src
[ ! -d test ] && mkdir test
touch src/index.js

if [ ! -f test/${PKG}.json ]; then
(
cat <<EOF
import plugin from '../lib/index';
import {expect} from 'chai';

describe('${PKG}', function(){

  it('should do something');

});


EOF
)>test/${SHORT_NAME}.json
fi

git add ../$PKG
