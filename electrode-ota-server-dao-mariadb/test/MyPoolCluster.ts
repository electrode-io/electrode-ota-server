import { IConnection, IError, IPool, IPoolCluster, IPoolClusterConfig, IPoolConfig } from "mysql";
import MyError from "./MyError";

export default class MyCluster implements IPoolCluster {
    public config: IPoolClusterConfig;
    public add(config: IPoolConfig): void;
    public add(group: string, config: IPoolConfig): void;
    public add(group: any, config?: any) {
        // console.log("adding config", group, config);
    }
    public end(callback?: (err: IError, ...args: any[]) => void): void {
        if (callback) {
            callback(new MyError("Sorry, buddy"));
        }
    }
    public getConnection(callback: (err: IError, connection: IConnection) => void): void;
    public getConnection(group: string, callback: (err: IError, connection: IConnection) => void): void;
    public getConnection(group: string, selector: string,
                         callback: (err: IError, connection: IConnection) => void): void;
    public getConnection(group: any, selector?: any, callback?: any) {
        if (callback) {
            callback(new Error("Sorry, buddy"));
        } else if (typeof group === "function") {
            group(new Error("Sorry, buddy"));
        }
    }

    public of(pattern: string): IPool;
    public of(pattern: string, selector: string): IPool;
    public of(pattern: string, selector?: string): IPool {
        throw new Error("Method not implemented.");
    }

    public on(ev: string, callback: (...args: any[]) => void): IPoolCluster;
    public on(ev: "remove", callback: (nodeId: number) => void): IPoolCluster;
    public on(ev: "connection", callback: (connection: IConnection) => void): IPoolCluster;
    public on(ev: "error", callback: (err: IError) => void): IPoolCluster;
    public on(ev: any, callback: any): IPoolCluster {
        throw new Error("Method not implemented.");
    }
}