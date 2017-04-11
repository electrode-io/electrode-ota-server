#!/usr/bin/env node
var fs = require('fs');
if (!fs.existsSync('test')) {
    console.log(`No tests found in ${process.cwd()}/test`);
    process.exit(0);
}
process.argv.push('--sourceMap=false', '--reportDir=.coverage', '--instrument=false', '--all', '--include=src/**/*.js', 'mocha', '--compilers', `js:${__dirname}/../babelhook-coverage`, 'test/*-test.js');
require('nyc/bin/nyc');
//--sourceMap=false --reportDir=.coverage --instrument=false --all --include=src/**/*.js mocha --compilers js:./electrode-ota-server-dev-util/babelhook-coverage'