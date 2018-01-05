import diregister from "electrode-ota-server-diregister";
import client, { createDatabaseForTest } from "./client";

export const daoDriver = async (options, logger) => {
  let mariaClient = new client({ options, logger });
  await mariaClient.init();
  return mariaClient;
};
export { createDatabaseForTest };

export const register = diregister(
  {
    name: "ota!dao-driver",
    multiple: false,
    connections: false,
    dependencies: ["ota!logger"]
  },
  daoDriver
);
