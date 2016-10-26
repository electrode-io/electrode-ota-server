"use strict";

const diregister = require('../../diregister');

const Dao = require('./dao-cassandra');
/** Can not use server.expose because object properties are merged by do not include
 the class properties.  This is legal, ugly and works **/

module.exports.register = diregister({
    name: "ota!dao",
    multiple: false,
    connections: false,
    dependencies: ['electrode:plugins', 'ota!cassandra']
}, (options, plugins, cassandra)=>new Dao(Object.assign({}, cassandra, options)));
