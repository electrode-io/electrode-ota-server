"use strict";

const cassandra = require('cassandra-driver');
const init = require('./init');
const diregister = require('../../diregister');

module.exports.register = diregister({
    name: "ota!cassandra",
    multiple: false,
    connections: false,
    dependencies: []
}, (options, plugins, cassandra)=>init(Object.assign({}, {
    contactPoints: ['localhost'],
    keyspace: 'ota'
}, options)).connect());
