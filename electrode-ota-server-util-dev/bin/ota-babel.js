#!/usr/bin/env node
const babelRc = require('../babelrc.prod.json');
var path = require('path');
var modname = path.join.bind(path, __dirname, '..', 'node_modules');
function push(arg) {
    //allow override by cli.
    if (process.argv.indexOf(arg) == -1) {
        process.argv.push(arg);
    }
}
function fix(prefix) {
    return function (v) {
        if (Array.isArray(v)) {
            v[0] = modname(`${prefix}-${v[0]}`);
            return v;
        }
        return modname(`${prefix}-${v}`);
    }
}
push('--source-maps');
push('--presets');
push(babelRc.presets.map(fix(`babel-preset`)));
push('--plugins');
push(babelRc.plugins.map(fix(`babel-plugin`)));
push('src');
push('--out-dir');
push('lib');
push('--copy-files');

console.log('running babel with', process.argv.slice(2));
require('babel-cli/lib/babel');
