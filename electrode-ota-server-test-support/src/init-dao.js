const dao = process.env.DAO || 'cassandra';
const init = require(`electrode-ota-server-dao-${dao}`).default;
const Dao = require(`electrode-ota-server-dao-${dao}/lib/dao-cassandra`).default;

let client;
export const shutdown = async () => {
    if (client) {
        await client.closeAsync();
        client = null;
    }
};
export default async (options = {}) => {
    try {
        if (client != null){
           throw new Error(`shutdown was not called`);
        }
        client = await init({
            contactPoints: ['localhost'],
            keyspace: `ota_server_test`,
            dangerouslyDropKeyspaceBeforeUse: true,
            ...options
        });
        return new Dao({client});
    } catch (e) {
        console.trace(e);
        throw e;
    }
};