import models from 'express-cassandra';
import udts from './models/UDTS';
import path from 'path';

export const CLIENT_OPTIONS = {
    contactPoints: ['127.0.0.1'],
    protocolOptions: {port: 9042},
    queryOptions: {consistency: models.consistencies.one}
};

export const ORM_OPTIONS = {
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


export default async function indexObject({clientOptions = {}, ormOptions = {}} = {}, drop) {
    const conf = {
        clientOptions: Object.assign({}, CLIENT_OPTIONS, clientOptions),
        ormOptions: Object.assign({}, ORM_OPTIONS, ormOptions)
    };
    const modelPath = 
    console.log(`[expresss-cassandra] using keyspace ${conf.clientOptions.keyspace} ${__dirname}/models`);
    if (drop === true) {
        console.log(`dropping keyspace ${conf.clientOptions.keyspace}`);
        const client = await models.createClient(conf);

        try {
            const connection = await client.connectAsync();
            const raw = connection._get_system_client();
            await  raw.executeAsync(`DROP KEYSPACE ${conf.clientOptions.keyspace}`);
        } catch (e) {
            console.trace(e);
        } finally {
            await client.close();
        }
    }
    await  models.setDirectory(__dirname + '/models').bindAsync(conf);
    return models;
};
