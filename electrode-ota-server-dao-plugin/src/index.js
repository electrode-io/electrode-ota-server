import diregister from "electrode-ota-server-diregister";
import Dao from './dao';
import path from 'path';
import clientFactory from "./client";

export const daoFactory = async (options, logger) => {
    const client = await clientFactory(options);
    await client.registerDirectoryAsync(path.join(__dirname, 'models'));
    return new Dao({client, logger})
};

export const register = diregister({
    name: "ota!dao",
    multiple: false,
    connections: false,
    dependencies: ['ota!logger']
}, daoFactory);
