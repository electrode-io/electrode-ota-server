"use strict";

const cassandra = require('cassandra-driver');
const init = require('./init');

const register = (server, options, next)=> init(Object.assign({}, {
    contactPoints: ['localhost'],
    keyspace: 'ota'
}, options)).connect().then(client=> {
    server.expose('client', client);
    next();
}, next);


register.attributes = {
    name: "ota!cassandra",
    multiple: false,
    connections: false
};

module.exports = {register};


