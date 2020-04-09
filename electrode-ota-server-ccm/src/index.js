import diregister from "electrode-ota-server-diregister";
import CCMStore from "@walmart/electrode-ccm-store";

const options = {
    ccmKey: "absetup",
    serviceName: "electrode-ota"
};
const ccm = new CCMStore(options);

// method used by external modules to retrieve the ccm config
export const getConfig = key => ccm.getConfig(key);

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getConfig);
