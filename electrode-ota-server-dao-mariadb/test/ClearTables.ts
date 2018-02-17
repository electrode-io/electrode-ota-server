import { IConnection } from "mysql";

export function clearTables(connection: IConnection): Promise<any> {
    const tables = ["metric", "client_ratio", "package_content",
                    "package_tag", "package_diff", "deployment_package_history",
                    "package", "deployment_app", "deployment",
                    "app_permission", "app",
                    "access_key", "user_auth_provider", "user"];

    return Promise.all(tables.map((table) => {
        return new Promise((resolve, reject) => {
            connection.query("DELETE FROM " + table + " WHERE 1 = 1", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }));
}
