"use strict";

import { expect } from "chai";
import { shasum } from "electrode-ota-server-util";
import ElectrodeOtaDaoRdbms from "../src/ElectrodeOtaDaoRdbms";
import { clearTables } from "./ClearTables";
import { AppDTO, PackageDTO, UserDTO } from "../src/dto";

// tslint:disable:no-console
const dao = new ElectrodeOtaDaoRdbms();
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
const STAGING = "Staging";
const stageDeploymentKey = "qjPVRyntQQrKJhkkNbVJeULhAIfVtHaBDfCFggzL";

describe("PackageDAO", function() {
  this.timeout(15000);

  const packageDTO = new PackageDTO();
  const userDTO = new UserDTO();
  userDTO.email = "bingo@walmart.com";
  userDTO.name = "bingo";
  userDTO.accessKeys = {
    abcdefg: {
      name: "abcdefg",
      friendlyName: "Login-abcdefg",
      expires: Date.now() + 60 * 24 * 3600 * 1000,
      id: "blah",
      email: userDTO.email
    }
  };
  const appDTO = new AppDTO();
  appDTO.name = "bingo";
  appDTO.collaborators = { [userDTO.email]: { permission: "Owner" } };
  appDTO.deployments = {
    [STAGING]: {
      key: stageDeploymentKey,
      name: STAGING
    }
  };

  function createObjects() {
    return dao
      .createUser(userDTO)
      .then(() => dao.createApp(appDTO))
      .then(app => {
        return dao.deploymentForKey(stageDeploymentKey);
      })
      .then(deployment => {
      });
  }

  before(() => {
    return dao
      .connect(testDBConfig)
      .then(() =>
        dao.getConnection().then(async connection => {
          await clearTables(connection);
          connection.release();
        })
      )
      .then(() => createObjects());
  });

  after(() => {
    return dao.close();
  });

  describe("getNewestApplicablePackage(), app with --targetBinaryVersion in semver", () => {
    const email = "semver@ota-test.com";
    const myPackage = (appVersion: string, pkg: string, label: string) => {
        const packageHash = shasum(pkg);
        const blobUrl = `http://localhost:3000/storagev2/${packageHash}`;
        const timeNow = new Date();

        packageDTO.appVersion = appVersion;
        packageDTO.blobUrl = blobUrl;
        packageDTO.created_ = timeNow;
        packageDTO.description = "foo-bar, blah blah, meh meh, foo bar";
        packageDTO.diffPackageMap = "";
        packageDTO.isDisabled = false;
        packageDTO.isMandatory = false;
        packageDTO.label = label;
        packageDTO.manifestBlobUrl = blobUrl;
        packageDTO.originalDeployment = "Staging";
        packageDTO.originalLabel = "";
        packageDTO.packageHash = packageHash;
        packageDTO.releaseMethod = "Upload";
        packageDTO.releasedBy = email;
        packageDTO.rollout = 100;
        packageDTO.size = 2345;
        packageDTO.uploadTime = timeNow;
        packageDTO.tags = [];

        return packageDTO;
    }

    it("should target only specific version, 1.2.3", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("1.2.3", "Some-package-content, foo-bar-1", "v1"))
            .then(() => {
                return dao.getNewestApplicablePackage(stageDeploymentKey, [], "1.2.5")
                .then(result => {
                    expect(result).to.be.undefined;
                });
            })
            .then(() => {
                return dao.getNewestApplicablePackage(stageDeploymentKey, [], "1.2.3")
                .then(result => {
                    expect(result).not.to.be.undefined;
                    if (result) {
                        expect(result.label).to.be.eq("v1");
                    }
                });
            });
    });

    it("should target any patch version but fixed major/minor version, 1.2.x", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("1.2.x", "Some package content, foo-bar, foobar-222", "v2"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "1.1.5")
              .then(result => {
                expect(result).to.be.undefined;
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "1.2.9")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v2");
                }
              });
          });
    });

    it("should target specific range: 1.3.3 - 1.3.7", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("1.3.3 - 1.3.7", "foo-bar, Some package content, foobar", "v3"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "1.3.2")
              .then(result => {
                expect(result).to.be.undefined;
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "1.3.7")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v3");
                }
              });
          });
    });

    it("should target specific range: >=2.4.3 <2.4.7", () => {
        return dao.addPackage(stageDeploymentKey, myPackage(">=2.4.3 <2.4.7", "Some package content", "v4"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "2.4.7")
              .then(result => {
                expect(result).to.be.undefined;
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "2.4.3")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v4");
                }
              });
          });
    });

    it("should target any patch version, 3.2", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("3.2", "Some package content", "v5"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "3.3.0")
              .then(result => {
                expect(result).to.be.undefined;
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "3.2.45")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v5");
                }
              });
          });
    });

    it("should target specific minor but any patch version, ~4.2.3", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("~4.2.3", "Some package content", "v6"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "4.3.3")
              .then(result => {
                expect(result).to.be.undefined;
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "4.2.35")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v6");
                }
              });
          });
    });

    it("should target any minor/patch version, ^5.2.3", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("^5.2.3", "Some package content", "v7"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "5.1.3")
              .then(result => {
                expect(result).to.be.undefined;
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "5.25.75")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v7");
                }
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "5.70.5")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v7");
                }
              });
          });
    });

    it("should upload two packages and test the semver criteria, ^6.0.0, ^7.0.0", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("^6.0.0", "Some package content, foo bar, label-6 for v6", "v8"))
          .then(() => {
            return dao.addPackage(stageDeploymentKey, myPackage("^7.0.0", "Some exclusive package content and foo-bar, foo bar, label-7 for v7", "v8"))
              .then(() => {
                return dao.getNewestApplicablePackage(stageDeploymentKey, [], "6.0.2")
                  .then(result => {
                    expect(result).not.to.be.undefined;
                    if (result) {
                        expect(result.label).to.be.eq("v8");
                    }
                  });
              });
          });
    });

    it("should target any device configured to consume updates, *", () => {
        return dao.addPackage(stageDeploymentKey, myPackage("*", "Some-package-content, foo-bar-1-**-foobar", "v9"))
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "7.2.15")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v9");
                }
              });
          })
          .then(() => {
            return dao.getNewestApplicablePackage(stageDeploymentKey, [], "9.22.3")
              .then(result => {
                expect(result).not.to.be.undefined;
                if (result) {
                    expect(result.label).to.be.eq("v9");
                }
              });
          });
    });
  });
});
