import { IError } from "mysql";

export default class MyError implements IError {
    public name: string;
    public message: string;
    public stack?: string;
    public code: string;
    public errno: number;
    public sqlStateMarker?: string;
    public sqlState?: string;
    public fieldCount?: number;
    public fatal: boolean;
    public sql?: string;

    constructor(msg: string) {
        this.message = msg;
    }
}
