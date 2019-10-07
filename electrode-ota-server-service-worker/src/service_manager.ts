import { ChildProcess, fork } from "child_process";
import { EventEmitter } from "events";
import { Stream } from "stream";
import ConfigDTO from "./dto/config";

const defaultOptions = {
  numberWorkers: 1
};

class WorkRecord {
  public options: any = {};
  public startTime?: number;
  public childHandle?: ChildProcess | null;
  public restart: number = 0;
  public error?: Error | null;
}

// type Logger = {
//   info: (msg: string) => {};
//   error: (msg: string) => {};
// };

export const STATE_INIT = 0;
export const STATE_RUNNING = 1;
export const STATE_STOPPING = 2;
export const STATE_STOPPED = 3;

/*
 * If parent exits, signal child to exit
 *
 */
export default class ServiceManager extends EventEmitter {
  private workers: WorkRecord[];
  private logger: any | null;
  private child_process: any;
  public state: number;

  constructor(logger: any | null = null) {
    super();
    this.workers = [];
    this.logger = logger;
    this.state = STATE_INIT;
  }

  /**
   * Starts forking the processes.  No guarantee is made on whether the processes are up.
   *
   */
  start(options: ConfigDTO): void {
    let fullOptions: ConfigDTO = Object.assign({}, defaultOptions, options);
    this.state = STATE_RUNNING;
    return this._forkWorkers(fullOptions);
  }

  stop(): void {
    if (this.workers.length === 0) {
      this._managerStopped();
      return;
    }
    this.state = STATE_STOPPING;
    for (let i: number = 0; i < this.workers.length; i++) {
      if (this.workers[i].childHandle) {
        this.workers[i].childHandle!.kill("SIGINT");
      }
    }
  }

  runningWorkers(): number {
    return this.workers.reduce((acc, rec) => (acc += rec.childHandle != null ? 1 : 0), 0);
  }

  private _forkWorkers(options: ConfigDTO): void {
    for (let i: number = 0; i < options.numberWorkers!; i++) {
      let record = new WorkRecord();
      record.options = options;
      record.restart = 0;
      this.workers.push(record);
      this._forkOne(record);
    }
    if (this.logger) {
      this.logger.info(
        `[electrode-ota-service-worker] ${options.numberWorkers!} service worker(s) starting`
      );
    }
  }

  private _forkOne(workRecord: WorkRecord): void {
    let handle = fork(workRecord.options.exec, workRecord.options.args, {
      cwd: workRecord.options.cwd,
      detached: false,
      stdio: ["ignore", "pipe", "pipe", "ipc"]
    });
    workRecord.childHandle = handle;
    workRecord.startTime = Date.now();
    workRecord.error = undefined;
    this._addChildListeners(handle);

    this.emit("child", "starting", handle);
  }

  private _managerStopped(): void {
    this.workers = [];
    this.state = STATE_STOPPED;
    this.emit("manager", "stopped");
  }

  private _childExitHandler(handle: ChildProcess, code: number, signal: string): void {
    let idx = this.workers.findIndex(record => record.childHandle === handle);
    if (idx >= 0) {
      this.workers[idx].childHandle = null;
      this.workers[idx].restart += 1;
      this.emit("child", "exited", handle);
      if (this.logger) {
        this.logger.info(`[electrode-ota-service-worker] Worker processes exited`);
      }

      if (this.state != STATE_STOPPING) {
        this._forkOne(this.workers[idx]);
      } else {
        if (this.runningWorkers() === 0) {
          this._managerStopped();
        }
      }
    }
  }

  private _childErrorHandler(handle: ChildProcess, err: any): void {
    if (this.logger) {
      this.logger.error(`[electrode-ota-service-worker] Unable to fork process ${err}`);
    }
    let idx = this.workers.findIndex(record => record.childHandle === handle);
    if (idx >= 0) {
      this.workers[idx].startTime = undefined;
      this.workers[idx].error = err;
    }
    this.emit("child", "error", handle, err);
  }

  private _addChildListeners(handle: ChildProcess): void {
    handle.once("error", this._childErrorHandler.bind(this, handle));
    handle.once("exit", this._childExitHandler.bind(this, handle));
    if (handle.stdout) {
      handle.stdout.on("data", (data: Buffer | string) => {
        if (this.logger) {
          this.logger.info(data.toString());
        }
      });
    }
    if (handle.stderr) {
      handle.stderr.on("data", (data: Buffer | string) => {
        if (this.logger) {
          this.logger.error(data.toString());
        }
      });
    }
  }
}
