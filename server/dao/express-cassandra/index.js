const models = require('express-cassandra');
const udts = require('./models/UDTS');


const CLIENT_OPTIONS = {
    contactPoints: ['127.0.0.1'],
    protocolOptions: {port: 9042},
    keyspace: 'express_test',
    queryOptions: {consistency: models.consistencies.one}
};

const ORM_OPTIONS = {
    //If your keyspace doesn't exist it will be created automatically
    //using the default replication strategy provided here.
    defaultReplicationStrategy: {
        class: 'SimpleStrategy',
        replication_factor: 1
    },
    migration: 'safe',
    createKeyspace: true,
    udts
};


module.exports = function ({clientOptions = {}, ormOptions = {}} = {}) {
    return models.setDirectory(__dirname + '/models').bindAsync({
        clientOptions: Object.assign({}, CLIENT_OPTIONS, clientOptions),
        ormOptions: Object.assign({}, ORM_OPTIONS, ormOptions)
    }).then(() => models);
};
