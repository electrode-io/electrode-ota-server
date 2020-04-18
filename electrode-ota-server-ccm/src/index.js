import diregister from "electrode-ota-server-diregister";

// An Abstract method (meant to be overriden)
//  to get any configuration required
export const getConfig = (/*options*/) => {
    // if not overriden, by default return 'false'
    return (/*key*/) => false;
}
export const register = diregister({
    name: "ota!ccm",
    multiple: false,
    connections: false,
    dependencies: []
}, getConfig);
