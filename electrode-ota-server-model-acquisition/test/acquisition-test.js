/* eslint-disable no-unused-expressions */
/* eslint-disable max-nested-callbacks */
/* eslint-disable max-statements */
import initDao, { shutdown } from "electrode-ota-server-test-support/lib/init-dao";
import acquisition from "electrode-ota-server-model-acquisition/lib/acquisition";
import { loggerFactory } from "electrode-ota-server-logger";
import { fileservice as uploadFactory } from "electrode-ota-server-fileservice-upload";
import { fileservice as downloadFactory } from "electrode-ota-server-fileservice-download";
import { diffPackageMapCurrent } from "electrode-ota-server-model-manifest/lib/manifest";
import appFactory from "electrode-ota-server-model-app/lib/app";
import { expect } from "chai";
import fs from "fs";
import sinon from "sinon";
import path from "path";

const fixture = path.join.bind(path, __dirname, "fixture");
const readFixture = file => fs.readFileSync(fixture(file));

describe("model/acquisition", function () {
    let ac;
    let appBL;
    let dao;
    let sandbox;
    this.timeout(50000);
    let i = 0;
    const genRatio = ratio => {
        const ret = ratio % (i += 25) == 0;
        return ret;
    };
    before(async () => {
        dao = await initDao();
        //options, dao, weighted, _download, manifest, logger
        const upload = uploadFactory({}, dao);
        const download = downloadFactory({}, dao);
        const logger = loggerFactory({});
        const manifest = diffPackageMapCurrent.bind(null, download, upload);
        ac = acquisition({}, dao, genRatio, download, manifest, logger);
        appBL = appFactory({}, dao, upload, logger);
    });
    after(shutdown);
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });
    afterEach(() => {
        sandbox.restore();
    })

    describe("isUpdateAble", () => {
        it("should be 50% rollout", () => {
            const result = [];
            const update = (uniqueClientId = "uniqueClientId",
                packageHash = "packageHash",
                ratio = 50) => () => ac.isUpdateAble(uniqueClientId, packageHash, ratio).then(r => result.push(r));
            const first = update();
            return first().then(first).then(first).then(_ => {
                const [r0, r1, r2] = result;
                expect(r0).to.be.true;
                expect(r1).to.be.true;
                expect(r2).to.be.true;
                result.length = 0;
            }).then(update("id1", "hash", 3))
                .then(update("id1", "hash", 3))
                .then(update("id1", "hash", 99))
                .then(_ => {
                    const [r0, r1, r2] = result;
                    expect(r0).to.be.false;
                    expect(r1).to.be.false;
                    expect(r2).to.be.false;
                });
        });

        it("will return true if tags are involved", () => {
            return ac.isUpdateAble("clientid", "190f09j9032", 0, ["TAG-1"]).then(result => {
                expect(result).to.eq(true);
            });
        });
    });

    describe("updateCheck", () => {
        const email = "test@unit-test.com";
        const name = "TestApp";
        let stagingKey = "";
        let productionKey = "";
        let clientUniqueId = "190jf09j2f01j10901";

        before(() => {
            return appBL.createApp({ email, name }).then(a => {
                return dao.deploymentByApp(a.id, "Staging").then(deployment => {
                    stagingKey = deployment.key;
                });
            });
        });

        it("will return package available for rollout 100 and no tags", () => {
            return appBL.upload({
                app: name,
                email,
                package: "stuff-stuff-stuff-stuff-stuff",
                deployment: "Staging",
                packageInfo: {
                    description: "release without tags initially",
                    rollout: 100
                }
            }).then(() => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0.0",
                    packageHash: "junk",
                    isCompanion: false,
                    label: "v0",
                    clientUniqueId
                }).then(result => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(true);
                });
            });
        });

        it("will return package not available for rollout 0 and no tags", () => {
            return appBL.upload({
                app: name,
                email,
                package: "more-stuff-stuff-stuff-stuff",
                deployment: "Staging",
                packageInfo: {
                    description: "another release without tags",
                    rollout: 0
                }
            }).then(() => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0.0",
                    packageHash: "junk",
                    isCompanion: false,
                    label: "v0",
                    clientUniqueId
                }).then(result => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(false);
                });
            });
        });

        it("will return package available if there are matching tags", () => {
            return appBL.upload({
                app: name,
                email,
                package: "even-more-stuff-stuff-stuff-stuff-stuff",
                deployment: "Staging",
                packageInfo: {
                    description: "Got some tags",
                    tags: ["TAG-1", "TAG-2"]
                }
            }).then(pkg => {
                expect(pkg).not.to.be.undefined;
                expect(pkg.packageHash).not.to.be.undefined;

                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0.0",
                    packageHash: "junk",
                    isCompanion: false,
                    label: "v0",
                    clientUniqueId,
                    tags: ["TAG-1"]
                }).then(result => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(true);
                    expect(result.packageHash).to.eq(pkg.packageHash);
                });
            });
        });

        it("will return package not available if there are no matching tags", () => {
            // depends on the previous tests
            return ac.updateCheck({
                deploymentKey: stagingKey,
                appVersion: "1.0.0",
                packageHash: "junk",
                isCompanion: false,
                label: "v0",
                clientUniqueId,
                tags: ["SOME-OTHER-TAG", "YET-ANOTHER-TAG"]
            }).then(result => {
                expect(result).not.to.be.undefined;
                expect(result.isAvailable).to.eq(false);
            });
        });

        it("no update if package version is greater than latest package", () => {
            return appBL.upload({
                app: name,
                email,
                package: "Some awesome package content",
                deployment: "Staging",
                packageInfo: {
                    description: "Some content"
                }
            }).then(pkg => {
                expect(pkg.appVersion).to.eql("1.0.0");
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0.1",
                    packageHash: "ABCD",
                    clientUniqueId
                }).then(result => {
                    expect(result.isAvailable).to.eq(false);
                });
            });
        });

        it("pick the appropriate package for the given appversion", () => {
            let pkg1_1, pkg1_2;
            return appBL.upload({
                app: name,
                email,
                package: "Package Content v1.0.0 goes here",
                deployment: "Staging",
                packageInfo: {
                    description: "Content for v1.0.0",
                    appVersion: "1.0.0"
                }
            }).then(pkg => {
                pkg1_1 = pkg;
                return appBL.upload({
                    app: name,
                    email,
                    package: "Package Content v1.2.0 goes here",
                    deployment: "Staging",
                    packageInfo: {
                        description: "Content for v1.2.0",
                        appVersion: "1.2.0"
                    }
                })
            }).then(pkg => {
                pkg1_2 = pkg;
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0.0",
                    packageHash: "ABCD",
                    clientUniqueId
                });
            }).then(result => {
                expect(result.isAvailable).to.be.true;
                expect(result.packageHash).to.eq(pkg1_1.packageHash);
            })
        });

        it("no update if package is disabled", () => {
            return appBL.upload({
                app: name,
                email,
                package: "Some disabled package",
                deployment: "Staging",
                packageInfo: {
                    isDisabled: true,
                    description: "Some disabled package"
                }
            }).then(pkg => {
                expect(pkg.isDisabled).to.be.true;
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0.0",
                    packageHash: "ABCD",
                    clientUniqueId
                }).then(result => {
                    expect(result.isAvailable).to.be.false;
                })
            })
        });

        it("shortened appVersion is ok", () => {
            return appBL
              .upload({
                app: name,
                email,
                package: "Some package content",
                deployment: "Staging",
                packageInfo: {
                  description: "Some package",
                  appVersion: "1.0.0"
                }
              })
              .then(pkg => {
                return ac
                  .updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.0",
                    packageHash: "ABCD",
                    clientUniqueId
                  })
                  .then(result => {
                    expect(result.isAvailable).true;
                    expect(result.packageHash).eq(pkg.packageHash);
                  });
              });
        });

        it("test upload shortened appVersion", () => {
            return appBL.upload({
                app:name,
                email,
                package: "Pkkk",
                deployment: "Staging",
                packageInfo: {
                    description: "Package info desc",
                    appVersion: "19.14"
                }
            }).then(pkg => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "19.14",
                    packageHash: "ABCD",
                    clientUniqueId
                })
                .then(result => {
                    expect(result.isAvailable).true;
                    expect(result.packageHash).eq(pkg.packageHash);
                    expect(result.appVersion).eq("19.14");
                })
            })
        });

        it("test updateAppVersion", () => {
            return appBL.upload({
                app: name,
                email,
                package: "Lower package",
                deployment: "Staging",
                packageInfo: {
                    description: "Lower package description",
                    appVersion: "20.2.1"
                }
            }).then(pkg => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "18.1.1",
                    packageHash: "ABCD",
                    clientUniqueId
                }).then(result => {
                    expect(result.updateAppVersion).to.be.undefined;
                    expect(result.isAvailable).to.be.false;
                })
            })
        });

        it("does not updatePackage if packageHash is not in deployment", () => {
            sandbox.spy(dao, "updatePackage");
            return appBL.upload({
                app: name,
                email,
                package: readFixture("package.0.zip"),
                deployment: "Staging",
                packageInfo: {
                    description: "Some Package",
                    appVersion: "1.4.3"
                }
            }).then(pkg => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    packageHash: "AABBCCDD",
                    appVersion: "1.4.3",
                    clientUniqueId
                }).then(result => {
                    expect(result.updateAppVersion).false;
                    expect(dao.updatePackage.called).false;

                })
            })
        });

        it("generates a diff for previous package", () => {
            let firstPkg, secondPkg;
            return appBL.upload({
                app:name,
                email,
                package: readFixture("package.0.zip"),
                deployment: "Staging",
                packageInfo: {
                    description: "First package",
                    appVersion: "14.33.2"
                }
            }).then(pkg => {
                firstPkg = pkg;
                return appBL.upload({
                    app: name,
                    email,
                    package: readFixture("package.1.zip"),
                    deployment: "Staging",
                    packageInfo: {
                        description: "Second package",
                        appVersion: "14.33.2"
                    }
                });
            }).then(pkg => {
                secondPkg = pkg;
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "14.33.2",
                    packageHash: firstPkg.packageHash,
                    clientUniqueId: "ABCDEF01234"
                });
            }).then(result => {
                expect(result.appVersion).eq("14.33.2");
                expect(result.isAvailable).true;
                expect(result.downloadURL).not.eq(firstPkg.downloadURL);
                expect(result.downloadURL).not.eq(secondPkg.downloadURL);
                return dao.packageById(secondPkg.id_);
            }).then(pkg => {
                expect(pkg.diffPackageMap).has.key(firstPkg.packageHash);
            });
        });
    });

    describe("updateCheck with --targetBinaryVersion in semver", () => {
        const email = "test@unit-test.com";
        const name = "TestSemverApp";
        let stagingKey = "";
        let productionKey = "";
        let clientUniqueId = "190jf09j2f01j10901";

        before(() => {
            return appBL.createApp({ email, name }).then(a => {
                return dao.deploymentByApp(a.id, "Staging").then(deployment => {
                    stagingKey = deployment.key;
                });
            });
        });

        it("should target any minor version", () => {
            return appBL
              .upload({
                app: name,
                email,
                package: "Some package content",
                deployment: "Staging",
                packageInfo: {
                  description: "Some package",
                  appVersion: "^1.0.0"
                }
              })
              .then(pkg => {
                return ac
                  .updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "2.2.0",
                    packageHash: "ABCD",
                    clientUniqueId
                  })
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: "1.14.1",
                    packageHash: "ABCD",
                    clientUniqueId
                  })
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });
    });

    describe("deployReportStatus", () => {
        const email = "test@unit-test.com";
        const name = "TestDeployStatusApp";
        let stagingKey = "";
        let clientUniqueId = "198u2irjwekhr1j901";

        before(() => {
            return appBL.createApp({ email, name }).then(a => {
                return dao.deploymentByApp(a.id, "Staging").then(deployment => {
                    stagingKey = deployment.key;
                });
            });
        });
        it("report from shortened appVersion", () => {
            return appBL.upload({
                app: name,
                email,
                package: "Pkg appy",
                deployment: "Staging",
                packageInfo: {
                    description: "Some shortened version",
                    appVersion: "19.14"
                }
            }).then(pkg => {
                const metric = {
                    appVersion: "19.14",
                    deploymentKey: stagingKey,
                    clientUniqueId,
                    label: "Blahblah",
                    status: "good",
                    previousLabelOrAppVersion: "19.13",
                    previousDeploymentKey: stagingKey
                };
                return ac.deployReportStatus(metric);
            }).then(() => dao.metrics(stagingKey))
            .then(metrics => {
                expect(metrics.length).eq(1);
                expect(metrics[0].appversion).eq("19.14");
            })
        })
    });
});
