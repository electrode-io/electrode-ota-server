import {
  Sequelize
} from "sequelize";
import {
  ProxyModelWrapper
} from "./proxy";

/**
 * Default database connection configs
 */
const defaultConfig = {
  host: "127.0.0.1",
  port: 3306,
  dialect: "mysql",
  db: "",
  user: "root",
  password: "",
  pool_max: 5,
  pool_idle: 30000,
  pool_acquire: 60000
};

/**
 * Create a Sequelize instance with given options
 *
 * @param {object} options - connection options
 * @returns {client} sequelize client
 */
export const createSequelizeClient = (options = {}) => {
  const config = Object.assign({}, defaultConfig, options);
  const client = new Sequelize(config.db, config.user, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci"
    },
    pool: {
      max: config.pool_max,
      idle: config.pool_idle,
      acquire: config.pool_acquire
    },
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    logging: config.logging || false
  });
  client.config = config;

  return client;
};

/**
 * Create a test database
 * Note: Should only be used for tests
 *
 * @param {*} options - connection options
 * @returns {client} sequelize client
 */
export const createDatabaseForTest = options => {
  const configCopy = Object.assign({}, options);
  const db = configCopy.db;
  delete configCopy.db;
  const client = createSequelizeClient(configCopy);
  if (process.env.NODE_ENV == "production") {
    throw new Error(
      "testCreateDatabase() should not be called in production; only in test"
    );
  }
  return client
    .query(`DROP DATABASE IF EXISTS ${db}`)
    .then(client.query(`CREATE DATABASE ${db}`))
    .then(() => client.close());
};

/**
 * MariaDB driver for use with `electrode-ota-server-dao-factory`.
 */
export default class DaoMariaDB {
  constructor({
    options,
    logger
  }) {
    this.sequelize = createSequelizeClient(options);
    this.logger = logger;
    this.logger.info("DAO MariaDB registered with", options);
  }

  /**
   * Initialize this driver asynchronously.
   *
   * Loads the DB models and synchronizing with the database (creates if missing)
   * @returns {none} None
   */
  async init() {
    this.logger.info("DAO MariaDB loading models and synchronizing tables");
    await this._loadModels();
    await this._synchronizeModels();
    Object.assign(this, {
      App: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.App,
        this.logger
      ),
      ClientRatio: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.ClientRatio,
        this.logger
      ),
      Deployment: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.Deployment,
        this.logger
      ),
      Metric: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.Metric,
        this.logger
      ),
      Package: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.Package,
        this.logger
      ),
      PackageContent: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.PackageContent,
        this.logger
      ),
      User: ProxyModelWrapper(
        this.sequelize,
        this.sequelize.models.User,
        this.logger
      )
    });
  }

  _loadModels() {
    // loads from ./models/index.js
    const modelLoader = require("./models").default;
    modelLoader(this.sequelize);
  }

  _synchronizeModels() {
    // creates tables if missing
    return this.sequelize.transaction(transaction =>
      this.sequelize.sync({
        transaction
      })
    );
  }

  /**
   * Close the connection
   *
   * @returns {status} close status
   */
  closeAsync() {
    return this.sequelize.close();
  }
}
