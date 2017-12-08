import diregister from "electrode-ota-server-diregister";
import Factory from './factory';

/**
 * DAO service provides a uniform data store abstraction layer for the OTA server.
 * 
 * All data store interactions go through this service.
 * Define the desires driver class for the supported data stores (ie. Cassandra, MariaDB).
 * 
 * Configuration Options
 * {
 *  driver: "<driver>",
 *  fileservice_driver: "<fileservice driver>"
 * }
 * driver = specifies the datastore driver used to power this DAO service.
 * fileservice_driver = datatsore driver for the upload/download fileservice
 * 
 * @param {dict} options : configuration options
 * @param {*} register : electrode register
 * @param {*} logger : ota logger
 */
export const daoFactory = (options, register, logger) => {
    return new Promise((resolve, reject) => {
        if (options.driver == null) {
            return resolve();
        }
        const client = typeof options.driver != 'string' ? options.driver : require(options.driver);
        register.call(this, client, options.driver.conf || {}, (e) => e ? reject(e) : resolve(client));
    })
    .then((client) => {
        if (client == null) {
            throw new Error(`Failed to load DAO driver '${options.driver}'`);
        }
        return new Factory({driver:client, logger});
    })
};

export const register = diregister({
    name: "ota!daofactory",
    multiple: false,
    connections: false,
    dependencies: ['electrode:register', 'ota!logger']
}, daoFactory);