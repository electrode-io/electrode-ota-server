import diregister from "electrode-ota-server-diregister";
import CCMStore from "@walmart/electrode-ccm-store";

// method used by external modules to retrieve the ccm config
export const getConfig = () => {
    // Init CCMStore with required serviceName
    //  ccmKey is optional; if present particular config props will be retrieved
    //  if not, all the root level configs will be retrieved
    // Any instance will start auto refresh
    const ccm = new CCMStore({
        ccmKey: "features",
        serviceName: "electrode-ota"
    });
    return key => ccm.getConfig(key);
};

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getConfig);
