const diregister = require('../diregister');
const {diffPackageMapCurrent} = require('./manifest');

const register = diregister({
    name: 'ota!manifest',
    multiple: false,
    connections: false,
    dependencies: ['ota!fileservice-download', 'ota!fileservice-upload']
}, (options, download, upload) =>diffPackageMapCurrent.bind(null, download, upload));

module.exports = {
    register
};

