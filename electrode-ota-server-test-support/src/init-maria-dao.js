import {clientFactory, createDatabaseForTest} from 'electrode-ota-server-dao-mariadb';
import {daoFactory} from 'electrode-ota-server-dao-factory';

let client;
const mockRegister = (driver, options, callback) => { callback() };

export const shutdownMaria = async () => {
    if (client) {
        await client.closeAsync();
        client = null;
    }
};

export default async (options = {}) => {
    try {
        if (client != null) {
            throw new Error('shutdown was not called');
        }
        const config = {
            "config": {
                "host": "localhost",
                "port": 3306,
                "db": "ota_db_test",
                "user": "root",
                "password":""
            }
        };
        await createDatabaseForTest(config);

        client = await clientFactory(config, null);
        await client.init();
        const factory = await daoFactory({driver:client}, mockRegister, null);
        return factory;
    } catch(e) {
        console.trace(e);
        throw e;
    }
}