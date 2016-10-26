const aquistion = require('./acquisition');
const register = require('../diregister')({
    name: 'ota!acquisition',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!weighted']
}, (options, dao, weighted) => aquistion(dao, weighted, options));

module.exports = {
    register
};

