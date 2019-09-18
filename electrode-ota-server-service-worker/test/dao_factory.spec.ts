"use strict";
import "babel-polyfill";
import { daoFactory, shutdown } from "../src/dao_factory";
import { expect } from "chai";
let sinon = require("sinon");

const testDBConfig = {
  clusterConfig: {
    canRetry: true,
    defaultSelector: "ORDER",
    removeNodeErrorCount: 5,
    restoreNodeTimeout: 0
  },
  poolConfigs: [
    {
      database: "electrode_ota",
      host: "localhost",
      password: "ota",
      port: 33060,
      user: "ota"
    }
  ],
  encryptionConfig: {
    keyfile: "./test/sample_encryption.key",
    fields: [
      "user.name",
      "user.email",
      "package.released_by",
      "access_key.friendly_name",
      "access_key.description"
    ]
  }
};

describe("dao-factory tests for mariadb", function() {
  this.timeout(10000);
  let logger: any;
  let sandbox: any;
  const serverConfigs = {
    plugins: {
      "electrode-ota-server-dao-plugin": {
        module: "electrode-ota-server-dao-mariadb",
        options: testDBConfig
      }
    }
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = sandbox.stub();
  });
  afterEach(() => {
    shutdown();
    sandbox.restore();
  });

  it("test create mariadb dao", () => {
    return daoFactory(serverConfigs, logger).then((dao: any) => {
      return dao.connect(testDBConfig).then(() => dao.close());
    });
  });

  it("test shutdown", () => {
    return daoFactory(serverConfigs, logger)
      .then((dao: any) => {
        return dao.getConnection();
      })
      .then(connection => {
        return shutdown().then(() => {
          return new Promise((resolve, reject) => {
            connection.ping((err: any) => {
              if (err) {
                expect(err.code).eq("PROTOCOL_ENQUEUE_AFTER_QUIT");
                resolve();
              }
              reject("Connection should have closed");
            });
          });
        });
      });
  });

  it("calling shutdown without daoFactory", () => {
    return shutdown();
  });

  it("calling daoFactory twice causes error", () => {
    return daoFactory(serverConfigs, logger).then((dao: any) => {
      return daoFactory(serverConfigs, logger)
        .then(() => {
          throw new Error("test should throw");
        })
        .catch(err => {
          expect(err.message).eq("shutdown was not called");
        });
    });
  });
});
