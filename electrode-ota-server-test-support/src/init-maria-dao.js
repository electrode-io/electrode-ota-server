import {
  daoDriver,
  createDatabaseForTest
} from "electrode-ota-server-dao-mariadb";
import {
  daoFactory
} from "electrode-ota-server-dao-factory";

let client;
const mockRegister = (driver, options, callback) => {
  callback();
};
const mockLogger = {
  info: () => {},
  error: () => {}
};

export const shutdownMaria = async () => {
  if (client) {
    await client.closeAsync();
    client = null;
  }
};

export default async (configOverrides = {}) => {
  try {
    if (client != null) {
      throw new Error("shutdown was not called");
    }
    const config = Object.assign({
      host: "localhost",
      port: 3306,
      db: "ota_db_test",
      dialect: "mysql",
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci"
      },
      user: "root",
      password: ""
    }, configOverrides);
    await createDatabaseForTest(config);

    const driver = await daoDriver(config, mockLogger);
    return daoFactory({}, driver, mockLogger);
  } catch (e) {
    console.trace(e);
    throw e;
  }
};
