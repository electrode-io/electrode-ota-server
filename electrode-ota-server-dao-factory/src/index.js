import diregister from "electrode-ota-server-diregister";
import Factory from "./factory";

/**
 * DAO service provides a uniform data store abstraction layer for the OTA server.
 *
 * All data store interactions go through this service.
 * Define the desires driver class for the supported data stores (ie. Cassandra, MariaDB).
 *
 * Configuration Options
 * {
 *  "driver": "<driver>",
 * }
 * driver = specifies the datastore driver used to power this DAO service.
 *
 * Example
 * "electrode-ota-server-dao-factory": {
 *   "driver": "electrode-ota-server-dao-mariadb"
 * }
 * "electrode-ota-server-dao-mariadb": {
 *   ...
 * }
 *
 * @param {dict} options : configuration options
 * @param {*} register : electrode register
 * @param {*} logger : ota logger
 */
export const daoFactory = async (options, driver, logger) => {
  if (driver == null) {
    throw new Error("DAO driver not loaded");
  }
  return new Factory({ driver, logger });
};

export const register = diregister(
  {
    name: "ota!dao",
    multiple: false,
    connections: false,
    dependencies: ["ota!dao-driver", "ota!logger"]
  },
  daoFactory
);
