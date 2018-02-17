import { IConnection, IConnectionConfig, IConnectionOptions, IError, IQueryFunction } from "mysql";

import MyError from "./MyError";

export default class MyConnection implements IConnection {
    public config: IConnectionConfig;
    public threadId: number;
    public query: IQueryFunction;

    public beginTransaction(callback: (err: IError) => void): void {
        callback(new MyError("Sorry, buddy"));
    }
    public connect(): void;
    public connect(callback: (err: IError, ...args: any[]) => void): void;
    public connect(options: any, callback?: (err: IError, ...args: any[]) => void): void;
    public connect(options?: any, callback?: any) {
        throw new Error("Method not implemented.");
    }
    public commit(callback: (err: IError) => void): void {
        callback(new MyError("Sorry, buddy"));
    }
    public changeUser(options: IConnectionOptions): void;
    public changeUser(options: IConnectionOptions, callback: (err: IError) => void): void;
    public changeUser(options: any, callback?: any) {
        throw new Error("Method not implemented.");
    }
    public end(): void;
    public end(callback: (err: IError, ...args: any[]) => void): void;
    public end(options: any, callback: (err: IError, ...args: any[]) => void): void;
    public end(options?: any, callback?: any) {
        throw new Error("Method not implemented.");
    }
    public ping(callback: (err: IError) => void): void {
        throw new Error("Method not implemented.");
    }
    public destroy(): void {
        throw new Error("Method not implemented.");
    }
    public pause(): void {
        throw new Error("Method not implemented.");
    }
    public release(): void {
        throw new Error("Method not implemented.");
    }
    public resume(): void {
        throw new Error("Method not implemented.");
    }
    public escape(value: any): string {
        throw new Error("Method not implemented.");
    }
    public escapeId(value: string): string;
    public escapeId(values: string[]): string;
    public escapeId(values: any): string {
        throw new Error("Method not implemented.");
    }
    public format(sql: string): string;
    public format(sql: string, values: any[]): string;
    public format(sql: string, values: any): string;
    public format(sql: any, values?: any): string {
        throw new Error("Method not implemented.");
    }
    public on(ev: string, callback: (...args: any[]) => void): IConnection;
    public on(ev: "error", callback: (err: IError) => void): IConnection;
    public on(ev: any, callback: any): IConnection {
        throw new Error("Method not implemented.");
    }
    public rollback(callback: () => void): void {
        throw new Error("Method not implemented.");
    }

}
