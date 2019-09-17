import diregister from "electrode-ota-server-diregister";
import * as path from "path";

import ServiceManager from "./service_manager";
import ConfigDTO from "../types/config";

const defaultWorkerOptions = {
  numberWorkers: 1,
  workerSleep: 300
};

export const factory = async (moduleOptions: any, logger: any) => {
  const workerOptions = Object.assign({}, defaultWorkerOptions, moduleOptions);
  const serviceDescriptor: ConfigDTO = {
    exec: path.join(__dirname, "./service_worker.ts"),
    args: ["--sleep", workerOptions.workerSleep * 1000],
    numberWorkers: workerOptions.numberWorkers
  };
  return ServiceManager.instance.start(serviceDescriptor, logger);
};

export const register = diregister(
  {
    name: "ota!worker",
    multiple: true,
    connections: false,
    dependencies: ["ota!logger"]
  },
  factory
);
