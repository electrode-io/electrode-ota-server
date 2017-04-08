"use strict";

const diregister = require('../diregister');

module.exports = {
    register: diregister({
        name: 'ota!model',
        multiple:false,
        connections:false,
        dependencies: ['electrode:expose', 'ota!dao']
    }, (options, expose, dao) => {
        expose({
            app: require('./app')(dao),
            account: require('./account')(dao)
        });
    })
};

