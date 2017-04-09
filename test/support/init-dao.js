const dao = process.env.DAO || 'express-cassandra';
const init = require(`../../server/dao/${dao}/init`).default;
const Dao = require(`../../server/dao/${dao}/dao-${dao}`).default;

export default async () => {
    const client = await (init({
        contactPoints: ['localhost'],
        keyspace: `ota_server_test`
    }).connect({reset: true}));
    return new Dao({client});
};
