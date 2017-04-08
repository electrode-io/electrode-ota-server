const diregister = require('../diregister');
const app = require('./app');

module.exports = {
    register: diregister({
        name: 'ota!app',
        multiple: false,
        connections: false,
        dependencies: ['ota!dao',  'ota!fileservice-upload']
    }, (options, dao, upload) => app(dao, upload,  options))
};

