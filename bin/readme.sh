#!/usr/bin/env bash
help(){
  [ -n "$1" ] && echo "ERROR: $*"
  echo "readme.sh <packagename>"
  exit 1;
}

valid_name() {
  [ -d "$1" ] || help "directory dost not exists $1"
   echo $1 | grep -q '^electrode-ota-server-'
}

PKG=$1
valid_name $PKG


if [ ! -f $PKG/README.md ]; then
(
cat <<EOF

${PKG}
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

## Install
___
$ npm install ${PKG}
___

## Usage

EOF
) | sed 's,___,```,g' >$PKG/README.md

fi
