import diregister from "electrode-ota-server-diregister";
import CCMStore from "./ccm-store";

let host = "http://scm.prod.walmart.com";
if (process.env.NODE_ENV !== "production") {
    host = "http://scm.stg.walmart.com";
}

const options = {
    host,
    cloudEnv: process.env.ONEOPS_ENVIRONMENT || "stg-dfw2",
    ccmKey: "absetup",
    env: process.env.ONEOPS_ENVPROFILE || "QA",
    serviceName: "electrode-ota"
};
options.ccmKey = "features";
options.serviceName = "home-app";
const ccm = new CCMStore(options);

// method used by external modules to retrieve the ccm config
export const getConfig = key => ccm.getConfig(key);

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getConfig);
