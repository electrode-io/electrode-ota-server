"use strict";
const diregister = require('../diregister');

const register = (server, options, next) => {
    server.route(options);
    return next();
};

register.attributes = {name:'electrode-ota-server-static'}

module.exports = {register};
