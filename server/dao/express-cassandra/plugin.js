"use strict";

const diregister = require('../../diregister');
const models = require('./index');
const Dao = require('./dao-express-cassandra');
/** Can not use server.expose because object properties are merged by do not include
 the class properties.  This is legal, ugly and works **/

module.exports.register = diregister({
    name: "ota!dao",
    multiple: false,
    connections: false,
}, async (options,  client)=> {

    const mod = await models(options);
    return new Dao(mod)
});
