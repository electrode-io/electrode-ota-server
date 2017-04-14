import diregister from "electrode-ota-server-diregister";
import Dao from './dao';
import path from 'path';

export const daoFactory = async (options, client) => {
    await client.registerDirectoryAsync(path.join(__dirname, 'models'));
    return new Dao({client})
};

export const register = diregister({
    name: "ota!dao",
    multiple: false,
    connections: false,
    dependencies: ['ota!cassandra']
}, daoFactory);
