import diregister from "electrode-ota-server-diregister";
//import {shasum} from 'electrode-ota-server-util';
import CCMStore from "./ccm-store";

let host = "http://scm.prod.walmart.com";
if (process.env.NODE_ENV !== "production") {
    host = "http://scm.stg.walmart.com";
}

const options = {
    host,
    serviceName: "home-app",
    /*QA | DEV*/
    env: process.env.ONEOPS_ENVPROFILE || "QA",
    /*stg-dfw2 | dev*/
    cloudEnv: process.env.ONEOPS_ENVIRONMENT || "stg-dfw2"
};
const ccm = new CCMStore(options);

// method used by external modules to retrieve the ccm config
export const getCCMConfig = key => ccm.getConfig(key);

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getCCMConfig);
