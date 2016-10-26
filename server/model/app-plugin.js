const diregister = require('../diregister');
const app = require('./app');

module.exports = {
    register: diregister({
        name: 'ota!app',
        multiple: false,
        connections: false,
        dependencies: ['ota!dao', 'ota!weighted', 'ota!fileservice']
    }, (options, dao, weighted, upload) => app(dao, weighted, upload, options))
};

