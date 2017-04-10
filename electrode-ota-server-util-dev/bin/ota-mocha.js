#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var testDir = path.join(process.cwd(), 'test')
if (!fs.existsSync(testDir) || fs.readdirSync(testDir).filter(function (t) {
        return /-test/.test(t)
    }).length == 0) {

    console.log('no tests for project ', process.cwd());
    process.exit(0);
}

console.log(`running tests in ${process.cwd()}`);
process.argv.push('--compilers', `js:${__dirname}/../babelhook`);
process.argv.push('test/*-test.js');
require('mocha/bin/mocha');
