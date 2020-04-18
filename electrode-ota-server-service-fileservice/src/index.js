import diregister from "electrode-ota-server-diregister";
export const register = diregister({
    name: "ota!fileservice",
    multiple: false,
    connections: false,
    dependencies: ["ota!fileservice-upload"]
}, (options, upload) => upload);
