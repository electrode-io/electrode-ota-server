import diregister from "electrode-ota-server-diregister";

// method used by external modules to retrieve the ccm config
export const getConfig = (/*options*/) => {
    // this method should be overrided by custom moduel that fetches configs from cloud
    //  by default, if not overriden return 'false'
    return (/*key*/) => false;
};

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getConfig);
