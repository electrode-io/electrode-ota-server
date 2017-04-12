import models from 'express-cassandra';
import fs from 'fs';
import path from 'path';
import {waitFor} from 'electrode-ota-server-util';

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
    createKeyspace: true
};
export const requireRelative = (directory, file) => {
    let res = require(path.join(directory, file));
    res = res.default || res;
    if (typeof res === 'function') {
        return res();
    }
    return res;
};

export default async function indexObject(options = {}) {
    let {clientOptions, ormOptions = {}, dangerouslyDropKeyspaceBeforeUse, ..._options} = options;
    if (!clientOptions) {
        clientOptions = _options;
    } else if (dangerouslyDropKeyspaceBeforeUse == null) {

        dangerouslyDropKeyspaceBeforeUse = clientOptions.dangerouslyDropKeyspaceBeforeUse;

    }
    const conf = {
        clientOptions: Object.assign({}, CLIENT_OPTIONS, clientOptions, {dangerouslyDropKeyspaceBeforeUse: void(0)}),
        ormOptions: Object.assign({udts: {}}, ORM_OPTIONS, ormOptions)
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
    let client = await models.createClient(conf);
    const connection = await client.connectAsync();

    if (dangerouslyDropKeyspaceBeforeUse === true) {
        console.log(`dropping keyspace ${conf.clientOptions.keyspace}`);
        try {
            const raw = connection._get_system_client();
            await  raw.executeAsync(`DROP KEYSPACE ${conf.clientOptions.keyspace}`);
        } catch (e) {
            console.trace(e);
        } finally {
            try {
                await client.close();
            } finally {
                client = await models.createClient(conf);
                await client.connectAsync();
            }
        }
    }

    client.registerDirectoryAsync = async function (directory) {
        //first udts.
        let udts = client.orm._options.udts;
        for (const indir of fs.readdirSync(directory)) {
            let udtsName = path.basename(indir, path.extname(indir));

            if (/^UDTS$/i.test(udtsName)) {
                const cudts = requireRelative(directory, indir);
                udts = Object.assign({}, udts, cudts);
            } else if (/(.+?)UDTS$/i.test(udtsName)) {
                let [, name] = /(.+?)UDTS/i.exec(udtsName) || [];
                if (name) {
                    const cudts = requireRelative(directory, indir);
                    udts = Object.assign({}, udts, {[name]: cudts});
                }
            }
        }
        if (udts && Object.keys(udts).length) {
            client.orm._options.udts = udts;
            await waitFor(client.orm._assert_user_defined_types, client.orm);
        }
        //second models
        for (const model of fs.readdirSync(directory)) {
            let modelName = path.basename(model, path.extname(model));

            let [, name] = /(.+?)Model/i.exec(modelName) || [];
            if (name) {
                const schema = requireRelative(directory, model);
                await client.loadSchemaAsync(name, schema);
            }
        }
    };

    return client;
};
