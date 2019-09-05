import * as child_process_module from "child_process";
import { EventEmitter } from "events";
import { Stream } from "stream";
import ConfigDTO from "../types/config";

const defaultOptions = {
  numberWorkers: 1,
  execArgv: process.execArgv
};

/*
 * If parent exits, signal child to exit
 *
 */
export default class ServiceManager extends EventEmitter {
  public static instance: ServiceManager = new ServiceManager();
  private workers: child_process_module.ChildProcess[];
  private logger: any;
  private child_process: any;

  constructor(ChildProcessModule: any = child_process_module) {
    super();
    this.workers = [];
    this.logger = null;
    this.child_process = ChildProcessModule;
  }

  start(options: ConfigDTO, logger: any): void {
    this.logger = logger;
    let fullOptions: ConfigDTO = Object.assign({}, defaultOptions, options);
    return this._forkWorkers(fullOptions);
  }

  stop(): void {
    for (let i: number = 0; i < this.workers.length; i++) {
      this.workers[i].kill("SIGINT");
    }
  }

  runningWorkers(): number {
    return this.workers.length;
  }

  _forkWorkers(options: ConfigDTO): void {
    for (let i: number = 0; i < options.numberWorkers; i++) {
      let child = this.child_process.fork(options.exec, options.args, {
        cwd: options.cwd,
        detached: true,
        stdio: ["ignore", "pipe", "pipe", "ipc"]
      });
      this.emit("child", "started", child);
      this.workers.push(child);
      this._childListeners(child);
    }
    this.logger.info(
      `[electrode-ota-service-worker] ${options.numberWorkers} service worker(s) started`
    );
  }

  _childListeners(child: child_process_module.ChildProcess): void {
    const that = this;
    const deleteChild = (c: child_process_module.ChildProcess) => {
      const idx: number = that.workers.indexOf(c);
      if (idx >= 0) {
        that.workers.splice(idx, 1);
      }
    };
    const checkLastChild = () => {
      if (that.workers.length === 0) {
        that.emit("manager", "stopped");
      }
    };
    child.on(
      "message",
      (data: any): void => {
        if (data.status && data.status === "OK") {
          that.emit("child", "running", child);
        }
      }
    );
    child.once(
      "error",
      (err: Error): void => {
        deleteChild(child);
        that.emit("child", "error", child);
        that.logger.error(`[electrode-ota-service-worker] Unable to fork process ${err}`);
      }
    );
    child.once(
      "exit",
      (code: number, signal: string): void => {
        deleteChild(child);
        that.emit("child", "exited", child);
        that.logger.info(`[electrode-ota-service-worker] Worker processes exited`);
        checkLastChild();
      }
    );
    if (child.stdout) {
      child.stdout.on("data", data => {
        that.logger.info(data.toString("utf-8"));
      });
    }
    if (child.stderr) {
      child.stderr.on("data", data => {
        that.logger.error(data.toString("utf-8"));
      });
    }
  }
}
