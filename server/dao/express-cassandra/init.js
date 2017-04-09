const cassandra = require('cassandra-driver');

const factory = require('./index');


module.exports = function init(clientOptions) {
    const conf = {clientOptions};
    const keyspace = clientOptions.keyspace;

    let client, models;
    const loadCassandra = () => {
        console.log('this is where loading would happen');

    };
    const cp = (...args) => new Promise((resolve, reject) => client.execute(...args, (e, o) => e ? reject(e) : resolve(o)));
    const order = (queries) => {
        let ret = Promise.resolve(true);
        for (const q of queries) ret = ret.then(_ => cp(q));
        ret = ret.then(() => cp(`use ${keyspace};`));
        return ret;
    };
    const drop = () => new Promise((resolve, reject) => client.execute(`drop KEYSPACE ${keyspace} ;`, (e) => e ? resolve() : resolve()));

    const reset = () => new Promise((resolve, reject) => {
        client.connect((e) => {
            if (e) return reject(e);
            resolve();
        })
    }).then(_ => drop().then(() => order(loadCassandra)));

    const connect = async (opts) => {
        const reset = opts ? opts.reset : false;
        let models = await factory(conf);
        if (reset) {
            try {
                const conn = models.orm._client;
                await  conn.executeAsync(`DROP KEYSPACE ${keyspace}`);
                await models.close();
                models = factory(conf);
            } catch (e) {
                models = await factory(conf);
            }
        }
        return models;


    };
    return {
        connect,
        reset,
        client,
        cp,
        order,
        drop
    }
};
