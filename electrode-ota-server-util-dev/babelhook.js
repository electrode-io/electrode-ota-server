"use strict";

require('babel-polyfill');
const conf = require('./babelrc.dev.json');
const Module = require('module');
const path = require('path');
const babelRegister = require('babel-register');
const oload = Module._load;
const modname = path.join.bind(path, __dirname, 'node_modules');

function fix(prefix) {
    return function (v) {
        if (Array.isArray(v)) {
            v[0] = modname(`${prefix}-${v[0]}`);
            return v;
        }
        return modname(`${prefix}-${v}`);
    }
}

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
conf.plugins = conf.plugins.map(fix(`babel-plugin`));
conf.presets = conf.presets.map(fix(`babel-preset`));

const project = path.join(__dirname, '..');
const otaRegex = /(@walmart\/)?electrode-ota-server/;
//only look into ern- projects that have a src directory.
conf.only = /electrode-ota-server[^/]*\/(src|test|lib)/;


Module._load = function (file, parent) {

    const isRelative = file.startsWith('.');

    const fullpath = isRelative ? path.resolve(path.dirname(parent.filename), file).replace(project, '') : file.startsWith('/') ? file.replace(project, '') : file;
    const parts = /^(electrode-ota(?:[a-z-]*))(?:\/node_modules\/(electrode-ota(?:[a-z-]*)))*(?:\/(?:src|lib)(?:\/?(.+?)?))?$/.exec(fullpath);
    if (parts) {
        const [_ig, pkg, fpkg, file = 'index.js'] = parts;
        const rp = path.join(project, fpkg || pkg, 'src', file);
        return oload(rp, parent);
    }
    return oload(file, parent);
};
babelRegister(conf);

