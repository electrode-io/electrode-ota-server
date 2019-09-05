#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var testDir = path.join(process.cwd(), "test");
if (
  !fs.existsSync(testDir) ||
  fs.readdirSync(testDir).filter(function(t) {
    return /spec\.ts/.test(t);
  }).length == 0
) {
  console.log("no tests for project ", process.cwd());
  process.exit(0);
}

console.log(`running tests in ${process.cwd()}`);
process.argv.push("--timeout", "20000");
process.argv.push("--require", "ts-node/register");
process.argv.push("--require", "source-map-support/register");
process.argv.push("--full-trace");
process.argv.push("--bail");
process.argv.push("--reporter", "spec");
process.argv.push("test/**/*spec.ts");
require(`${__dirname}/../node_modules/mocha/bin/mocha`);
