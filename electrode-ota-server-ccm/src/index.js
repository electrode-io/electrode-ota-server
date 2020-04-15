import diregister from "electrode-ota-server-diregister";

// method used by external modules to retrieve the ccm config
export const getConfig = (options, dao) => {
    // getConfig is not yet present within electrode-ota-server
    //  A module has to be passed into to override it or has to be implemented in app-dao
    return key => typeof dao.getConfig === "function" ? dao.getConfig(key) : undefined;
};

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: ["ota!dao"]
}, getConfig);
