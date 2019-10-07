let dao: any = null;

export const shutdown = async () => {
  if (dao) {
    await dao.disconnect();
    dao = null;
  }
};

export const daoFactory = async (serverConfigs: any = {}, logger: any): Promise<any> => {
  try {
    if (dao != null) {
      throw new Error(`shutdown was not called`);
    }
    let pluginConfigs = {
      module: "electrode-ota-server-dao-plugin",
      options: {}
    };
    if (serverConfigs.plugins && serverConfigs.plugins["electrode-ota-server-dao-plugin"]) {
      pluginConfigs = serverConfigs.plugins["electrode-ota-server-dao-plugin"];
    }
    const daoPlugin = require(pluginConfigs.module || "electrode-ota-server-dao-plugin");
    dao = await daoPlugin.daoFactory(pluginConfigs.options, logger);
    return dao;
  } catch (e) {
    throw e;
  }
};
