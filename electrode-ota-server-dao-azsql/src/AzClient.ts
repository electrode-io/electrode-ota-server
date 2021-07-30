// AzureSQL driver
import { config, ConnectionPool } from "mssql";

const AzClient = async (options: config) => {
    let pool: any;

    const closePool = async () => {
        try {
            // try to close the connection pool
            await pool.close();

            // set the pool to null to ensure
            // a new one will be created by getConnection()
            pool = null;
        } catch () {
            // error closing the connection (could already be closed)
            // set the pool to null to ensure
            // a new one will be created by getConnection()
            pool = null;
            // server.log( [ "error", "data" ], "closePool error" );
            // server.log( [ "error", "data" ], err );
        }
    };

    const getConnection = async () => {
        try {
            if (pool) {
                // has the connection pool already been created?
                // if so, return the existing pool
                return pool;
            }
            // create a new connection pool
            pool = new ConnectionPool(options);

            // catch any connection errors and close the pool
            pool.on("error", async(err: any) => {
                // server.log( [ "error", "data" ], "connection pool error" );
                // server.log( [ "error", "data" ], err );
                await closePool();
            } );
            return pool;
        } catch () {
            // error connecting to SQL Server
            // server.log( [ "error", "data" ], "error connecting to sql server" );
            // server.log( [ "error", "data" ], err );
            pool = null;
        }
    };

    // this is the API the client exposes to the rest
    // of the application
    return { getConnection }
};

module.exports = AzClient;
