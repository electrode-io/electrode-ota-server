import * as assert from "assert";

import { expect } from "chai";

import { createConnection, IConnection } from "mysql";
import BaseDAO from "../src/dao/BaseDAO";

import { clearTables } from "./ClearTables";

import MyConnection from "./MyConnection";

class TestDAO extends BaseDAO {
    public static testBadQuery(connection: IConnection): Promise<any> {
        return TestDAO.query(connection, "SELECT junk FROM nothing WHERE stuff = ?", [1]);
    }

    public static async testRollback(connection: IConnection): Promise<any> {
        await TestDAO.beginTransaction(connection);
        await TestDAO.query(connection, "INSERT INTO app (name) VALUES(?);", ["testApp"]);
        return TestDAO.rollback(connection);
    }

    public static async testBeginTransactionFailure(connection: MyConnection): Promise<void> {
        return TestDAO.beginTransaction(connection);
    }

    public static async testCommitFailure(connection: MyConnection): Promise<void> {
        return TestDAO.commit(connection);
    }
}

const connectionConfig = {
    database: "electrode_ota",
    host: "localhost",
    password: "ota",
    port: 33060,
    user: "ota",
};
let testConnection: IConnection;

describe("BaseDAO", () => {
    before(() => {
        testConnection = createConnection(connectionConfig);
        return new Promise((resolve, reject) => {
            testConnection.connect((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }).then(() => {
            clearTables(testConnection);
        });
    });

    after(() => {
        return new Promise((resolve, reject) => {
            testConnection.end((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });

    describe("query", () => {
        it("will reject on a bad query", () => {
            return TestDAO.testBadQuery(testConnection).catch((err) => {
                expect(err).not.to.be.undefined;
            });
        });
    });

    describe("rollback", () => {
        it("will rollback a transaction", () => {
            return TestDAO.testRollback(testConnection).then(() => {
                return new Promise((resolve, reject) => {
                    testConnection.query("SELECT COUNT(name) count FROM app WHERE name = ?",
                        ["testApp"], (err, results) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        expect(results).not.to.be.undefined;
                        expect(results.length).to.eq(1);
                        expect(results[0].count).to.eq(0);
                        resolve();
                    });
                });
            });
        });
    });

    describe("other failures", () => {
        const badConnection = new MyConnection();
        it("will throw on error if beginTransaction fails", () => {
            return TestDAO.testBeginTransactionFailure(badConnection).catch((err) => {
                expect(err).not.to.be.undefined;
            });
        });

        it("will throw an error if commit fails", () => {
            return TestDAO.testCommitFailure(badConnection).catch((err) => {
                expect(err).not.to.be.undefined;
            });
        });
    });
});
