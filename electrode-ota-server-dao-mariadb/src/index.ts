import diregister from "electrode-ota-server-diregister";
import ElectrodeOtaDaoRdbms from "./ElectrodeOtaDaoRdbms";

export const register = diregister({
    connections: false,
    dependencies: [],
    multiple: false,
    name: "ota!dao",
}, (options: any) => {
    const dao = new ElectrodeOtaDaoRdbms();
    return dao.connect(options).then(() => dao);
});

process.on("unhandledRejection", (error) => {
    console.log("unhandledRejection", error);
});
