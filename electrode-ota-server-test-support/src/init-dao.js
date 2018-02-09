import {daoFactory} from 'electrode-ota-server-dao-plugin';
import {loggerFactory} from 'electrode-ota-server-logger';
// import {clientFactory} from 'electrode-ota-server-dao-cassandra';

let dao;
export const shutdown = async () => {
    if (dao) {
        await dao.disconnect();
        dao = null;
    }
};
export default async (options = {}) => {
    try {
        if (dao != null) {
            throw new Error(`shutdown was not called`);
        }
        dao = await daoFactory({
            contactPoints: ['localhost'],
            keyspace: `ota_server_test`,
            dangerouslyDropKeyspaceBeforeUse: true,
            ...options            
        }, loggerFactory);
        return dao;
    } catch (e) {
        console.trace(e);
        throw e;
    }
};
