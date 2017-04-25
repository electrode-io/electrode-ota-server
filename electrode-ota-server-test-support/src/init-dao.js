import {daoFactory} from 'electrode-ota-server-dao-plugin';
import {clientFactory} from 'electrode-ota-server-dao-cassandra';

let client;
export const shutdown = async () => {
    if (client) {
        await client.closeAsync();
        client = null;
    }
};
export default async (options = {}) => {
    try {
        if (client != null) {
            throw new Error(`shutdown was not called`);
        }
        client = await clientFactory({
            contactPoints: ['localhost'],
            keyspace: `ota_server_test`,
            dangerouslyDropKeyspaceBeforeUse: true,
            ...options
        });
        const dao = await daoFactory({}, client);
        return dao;
    } catch (e) {
        console.trace(e);
        throw e;
    }
};
