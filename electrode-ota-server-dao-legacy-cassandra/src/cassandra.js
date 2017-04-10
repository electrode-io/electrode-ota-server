import init from './init';
import diregister from "electrode-ota-server-diregister";

module.exports.register = diregister({
    name: "ota!cassandra",
    multiple: false,
    connections: false,
    dependencies: []
}, (options, plugins, cassandra)=>init(Object.assign({}, {
    contactPoints: ['localhost'],
    keyspace: 'ota'
}, options)).connect());
