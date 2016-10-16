"use strict";
const diregister = require('../diregister');

module.exports.register = diregister({
    name: 'static',
    dependencies: ['electrode:route', 'inert']
}, (options, route) => route(options));