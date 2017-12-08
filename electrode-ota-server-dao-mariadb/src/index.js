import diregister from "electrode-ota-server-diregister";
import client, {createDatabaseForTest} from "./client";

export const clientFactory = (options, logger) => new client({options, logger});
export {createDatabaseForTest};

export const register = diregister({
    name: "ota!mariadb",
    multiple: false,
    connections: false,
    dependencies: ["ota!logger"]
}, clientFactory);
