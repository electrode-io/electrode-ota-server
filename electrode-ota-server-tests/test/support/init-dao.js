const dao = process.env.DAO || 'cassandra';
const init = require(`electrode-ota-server-dao-${dao}/lib/init`).default;
const Dao = require(`electrode-ota-server-dao-${dao}/lib/dao-cassandra`).default;

export default async () => {
    try {
        const client = await (init({
            contactPoints: ['localhost'],
            keyspace: `ota_server_test`
        }).connect({reset: true}));
        return new Dao({client});
    } catch (e) {
        console.trace(e);
        throw e;
    }
};
