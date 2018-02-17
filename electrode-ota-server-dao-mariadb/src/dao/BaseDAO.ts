import { IConnection } from "mysql";

let inTransaction = false;
export default class BaseDAO {
    protected static isInTransaction(): boolean {
        return inTransaction;
    }

    protected static async beginTransaction(connection: IConnection): Promise<any> {
        return new Promise((resolve, reject) => {
            connection.beginTransaction((err) => {
                if (err) {
                    inTransaction = false;
                    reject(err);
                } else {
                    inTransaction = true;
                    resolve();
                }
            });
        });
    }

    protected static async commit(connection: IConnection): Promise<any> {
        return new Promise((resolve, reject) => {
            connection.commit((err) => {
                inTransaction = false;
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    protected static async rollback(connection: IConnection): Promise<any> {
        return new Promise((resolve, reject) => {
            connection.rollback(() => {
                inTransaction = false;
                resolve();
            });
        });
    }

    protected static async query(connection: IConnection, sql: string, params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
            connection.query(sql, params, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.log("Exception caught querying the database", e);
        }
        });
    }
}
