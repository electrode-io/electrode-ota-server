"use strict";

const cassandra = require('cassandra-driver');
const diregister = require('../../diregister');
const client = require('./index');

module.exports.register = diregister({
    name: "ota!cassandra",
    multiple: false,
    connections: false,
    dependencies: []
}, async (clientOptions, plugins, cassandra) =>{
    console.log('clientOptions',clientOptions);
    return await client({clientOptions})
});
