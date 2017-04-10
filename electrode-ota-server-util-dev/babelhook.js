"use strict";

require('babel-polyfill');
const conf = require('./babelrc.dev.json');
const Module = require('module');
const path = require('path');
const babelRegister = require('babel-register');
const oload = Module._load;

if (process.env.COVERAGE) {
    console.log('Has Coverage');
    conf.plugins.push([
        "istanbul",
        {
            "exclude": [
                "**/test/*-test.js"
            ]
        }
    ]);
}
const project = path.join(__dirname, '..');
const otaRegex = /(@walmart\/)?electrode-ota-server-/;
//only look into ern- projects that have a src directory.
conf.only = /electrode-ota-server-[^/]*\/(src|test|lib)/;

/**
 * Babelify all ern- projects.  And if they
 * are an ern- project than use the src.
 *
 * @param file
 * @param parent
 * @private
 */
function normalizePath(file, parent) {
    if (/^\./.test(file)) {
        return file;
    }
    if (/^\//.test(file)) {
        if (file.startsWith(project + '/electrode-ota-server-')) {
            return file.replace(project + '/', '');
        }
        return file;
    }
    if (otaRegex.test(file)) {
        return file.replace('@walmart/', '');
    }
    return;
}
Module._load = function (file, parent) {

    let absFile = normalizePath(file, parent);
    if (absFile) {


        let parts = absFile.split('/');
        let scope = parts[0], pkg = parts[1], rest = parts.slice(2).join(path.sep);
        if (/electrode-ota-server-/.test(scope)) {
            if (!pkg || pkg == 'dist') pkg = 'src';
            file = path.join(project, scope, pkg, rest || 'index');// `${project}/${pkg}/${rest ? '/' + rest : ''}`
        }
    }

    return oload(file, parent);
};
babelRegister(conf);

