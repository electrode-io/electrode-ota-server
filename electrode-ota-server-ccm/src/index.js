import diregister from "electrode-ota-server-diregister";
//import {shasum} from 'electrode-ota-server-util';
import CCMStore from "./ccm-store";

// getCCMConfig
export const getCCMConfig = options => {
    const ccm = new CCMStore(options);
    const store = {};
    return async key => {
        if (!store) {
            await ccm.refresh();
        }
        return ccm.getConfig(key);
    };
};

export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getCCMConfig);
