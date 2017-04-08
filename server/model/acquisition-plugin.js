const aquistion = require('./acquisition');
const register = require('../diregister')({
    name: 'ota!acquisition',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!weighted', 'ota!fileservice-download', 'ota!manifest']
}, (options, dao, weighted, download, manifest) => aquistion(dao, weighted, download, manifest, options));

module.exports = {
    register
};

