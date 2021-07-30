import diregister from "electrode-ota-server-diregister";
import ElectrodeOtaDaoRdbms from "./ElectrodeOtaDaoRdbms";
import Encryptor from "./Encryptor";

export * from "./dto";

export const daoFactory = (options: any) => {
  const dao = new ElectrodeOtaDaoRdbms();

  return Encryptor.instance
    .initialize(options.encryptionConfig || {})
    .then(() => dao.connect(options))
    .then(() => dao);
};
export const register = diregister(
  {
    connections: false,
    dependencies: [],
    multiple: false,
    name: "ota!dao"
  },
  daoFactory
);

process.on("unhandledRejection", error => {
  console.log("unhandledRejection", error);
});
