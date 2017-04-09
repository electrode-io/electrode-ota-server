import diregister from '../../diregister';
const register = diregister({
    name: "ota!fileservice",
    multiple: false,
    connections: false,
    dependencies: ['ota!fileservice-upload', 'ota!fileservice-download']
}, (options, upload)=> upload);

module.exports = {
    register
};
