//import { IConnection } from "mysql";
import { ConnectionPool, Request, Transaction } from "mssql";

const generateString = (length: number) => {
    var result = '';
    var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charsetlen = charset.length;
    for ( var i = 0; i < length; i++ ) {
      result += charset.charAt(Math.floor(Math.random() * charsetlen));
   }
   return result;
}

let inTransaction = false;
export default class BaseDAO {
    private txn: Transaction;

    protected static isInTransaction(): boolean {
        return inTransaction;
    }

    protected static async beginTransaction(connection: ConnectionPool): Promise<any> {
        if (!this.txn) {
            this.txn = new Transaction(connection);
        }

        return new Promise((resolve, reject) => {
            this.txn.begin((err: any) => {
                if (err) {
                    inTransaction = false;
                    reject(err);
                } else {
                    inTransaction = true;
                    resolve(void);
                }
            });
        });
    }

    protected static async commit(connection: ConnectionPool): Promise<any> {
        return new Promise((resolve, reject) => {
            this.txn.commit((err: any) => {
                inTransaction = false;
                if (err) {
                    reject(err);
                } else {
                    resolve(void);
                }
            });
        });
    }

    protected static async rollback(connection: ConnectionPool): Promise<any> {
        return new Promise((resolve, reject) => {
            this.txn.rollback(() => {
                inTransaction = false;
                resolve(void);
            });
        });
    }

    protected static prepare(request: Request, sql: string, params: any[]): string {
        let preparedQuery = sql;
        const randomString = generateString(5);
        for (let i = 0; i < params.length; i++) {
          let parameterName = randomString + i;
          request.input(parameterName, params[i]);
          preparedQuery = preparedQuery.replace(/\?/, `@${parameterName}`)
        }
        return preparedQuery;
    }

    protected static async query(connection: ConnectionPool, sql: string, params: any[]): Promise<any> {
        let sqlConnection = connection.request();
        if (inTransaction) {
            sqlConnection = this.txn.request();
        }
        // prepare the mysql type sql query to mssql compatible query
        const newQuery = this.prepare(sqlConnection, sql, params);
        return new Promise((resolve, reject) => {
            try {
                sqlConnection.query(newQuery, (err: any, results: unknown) => {
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
