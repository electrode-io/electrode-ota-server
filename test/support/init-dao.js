const dao = process.env.DAO || 'express-cassandra';
const init = require(`../../server/dao/${dao}/init`);
const Dao = require(`../../server/dao/${dao}/dao-${dao}`);

module.exports = async () => {
    const client = await (init({
        contactPoints: ['localhost'],
        keyspace: `ota_${dao.replace(/-/g, '_')}`
    }).connect({reset: true}));
    return new Dao({client});
};
