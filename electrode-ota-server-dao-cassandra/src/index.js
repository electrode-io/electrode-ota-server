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
    migration: 'alter',
    createKeyspace: true,
    udts
};

const sleep = (time, value = 'sleeping for') => {

//    console.log(`${value} ${time}ms`);
    return new Promise(resolve => setTimeout(() => {
//        console.log(`awaking`);
        resolve();
    }, time));
};


export default async function indexObject(options) {
    let {clientOptions, ormOptions = {}, dangerouslyDropKeyspaceBeforeUse, ..._options} = options;
    if (!clientOptions) {
        clientOptions = _options;
    } else if (dangerouslyDropKeyspaceBeforeUse == null) {

        dangerouslyDropKeyspaceBeforeUse = clientOptions.dangerouslyDropKeyspaceBeforeUse;

    }
    const conf = {
        clientOptions: Object.assign({}, CLIENT_OPTIONS, clientOptions, {dangerouslyDropKeyspaceBeforeUse:void(0)}),
        ormOptions: Object.assign({}, ORM_OPTIONS, ormOptions)
    };

    if (conf.authProvider && models.driver.auth[conf.authProvider.provider]) {
        if (conf.authProvider.provider) {
            if (Array.isArray(conf.authProvider.auth)) {
                conf.authProvider = new models.driver.auth[conf.authProvider.provider](...conf.authProvider.auth);
            } else {
                conf.authProvider = new models.driver.auth[conf.authProvider.provider](conf.authProvider.auth);
            }
        }
    }

    console.log(`[expresss-cassandra] using keyspace ${conf.clientOptions.keyspace} ${__dirname}/models`);
    if (dangerouslyDropKeyspaceBeforeUse === true) {
        console.log(`dropping keyspace ${conf.clientOptions.keyspace}`);
        const client = await models.createClient(conf);
        let dropped = false;

        try {
            const connection = await client.connectAsync();
            const raw = connection._get_system_client();
            await  raw.executeAsync(`DROP KEYSPACE ${conf.clientOptions.keyspace}`);
            dropped = true;
        } catch (e) {
            console.trace(e);
        } finally {
            try {
                await client.close();
            } finally {
                await sleep(500, dropped ? `sleeping after KEYSPACE drop success for ` : `sleeping after KEYSPACE drop failure for`);
            }
        }
    }
    await  models.setDirectory(__dirname + '/models').bindAsync(conf);
    return models;
};
