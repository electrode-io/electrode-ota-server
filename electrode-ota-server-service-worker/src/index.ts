import diregister from "electrode-ota-server-diregister";
import * as path from "path";

import ServiceManager from "./service_manager";
import ConfigDTO from "./dto/config";

const defaultWorkerOptions = {
  numberWorkers: 1,
  workerSleep: 300,
  logging: "error"
};

let svc:ServiceManager;

export const factory = async (moduleOptions: any, logger: any) => {
  if (!svc) {
    svc = new ServiceManager(logger);
  }
  const workerOptions = Object.assign({}, defaultWorkerOptions, moduleOptions);
  const serviceDescriptor: ConfigDTO = {
    exec: path.join(__dirname, "./service_worker"),
    args: ["--sleep", "" + (workerOptions.workerSleep), "--logging", workerOptions.logging ],
    numberWorkers: workerOptions.numberWorkers
  };
  return svc.start(serviceDescriptor);
};
export const test_inject_svc = (inject_svc?:ServiceManager) => {
  svc = inject_svc!;
}
export const test_get_svc = () => {
  return svc;
}

export const register = diregister(
  {
    name: "ota!worker",
    multiple: true,
    connections: false,
    dependencies: ["ota!logger"]
  },
  factory
);
