const dao = process.env.DAO || 'cassandra';
const init = require(`electrode-ota-${dao}/dist/init`).default;
const Dao = require(`electrode-ota-${dao}/dist/dao-${dao}`).default;

export default async () => {
    const client = await (init({
        contactPoints: ['localhost'],
        keyspace: `ota_server_test`
    }).connect({reset: true}));
    return new Dao({client});
};
