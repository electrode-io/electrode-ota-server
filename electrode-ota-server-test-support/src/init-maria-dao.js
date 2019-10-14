let path = require("path");

let dao;
export const shutdown = async () => {
  if (dao) {
    await dao.disconnect();
    dao = null;
  }
};

export const clearTables = (connection) => {
  const tables = [
    "metric",
    "metrics_summary",
    "client_ratio",
    "package_content",
    "package_tag",
    "package_diff",
    "deployment_package_history",
    "package",
    "deployment_app",
    "deployment",
    "app_permission",
    "app",
    "access_key",
    "user_auth_provider",
    "user"
  ];
  return Promise.all(
    tables.map(table => {
      return new Promise((resolve, reject) => {
        connection.query("DELETE FROM " + table + " WHERE 1 = 1", (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    })
  );
}

const defaultServerConfigs = {
  plugins: {
    "electrode-ota-server-dao-plugin": {
      module: path.resolve(__dirname, "../../electrode-ota-server-dao-mariadb"),
      options: {
        clusterConfig: {
          canRetry: true,
          defaultSelector: "ORDER",
          removeNodeErrorCount: 5,
          restoreNodeTimeout: 0
        },
        poolConfigs: [
          {
            database: "electrode_ota",
            host: "localhost",
            password: "ota",
            port: 33060,
            user: "ota"
          }
        ],
        encryptionConfig: {
          keyfile: path.resolve(__dirname, "./sample_encryption.key"),
          fields: [
            "user.name",
            "user.email",
            "package.released_by",
            "access_key.friendly_name",
            "access_key.description"
          ]
        }
      }
    }
  }
};

export default async (overrides = {}, logger) => {
  try {
    if (dao != null) {
      throw new Error(`shutdown was not called`);
    }
    let pluginConfigs = {
      module: "electrode-ota-server-dao-plugin",
      options: {}
    };
    const serverConfigs = Object.assign({}, defaultServerConfigs, overrides);
    if (serverConfigs.plugins && serverConfigs.plugins["electrode-ota-server-dao-plugin"]) {
      pluginConfigs = serverConfigs.plugins["electrode-ota-server-dao-plugin"];
    }
    const daoPlugin = require(pluginConfigs.module || "electrode-ota-server-dao-plugin");
    dao = await daoPlugin.daoFactory(pluginConfigs.options, logger);
    
    const conn = await dao.getConnection();
    await clearTables(conn);
    conn.release();

    return dao;
  } catch (e) {
    console.trace(e);
    throw e;
  }
};
