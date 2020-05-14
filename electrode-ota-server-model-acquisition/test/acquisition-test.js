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
        const productionKey = "";
        const clientUniqueId = "190jf09j2f01j10901";

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
                    expect(result.isAvailable).false;
                });
            });
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
        const clientUniqueId = "190jf09j2f01j10901";
        const myPackage = (appVersion, pkg) => ({
            email,
            app: name,
            deployment: "Staging",
            package: pkg,
            packageInfo: { appVersion, description: "Some package" }
        });
        const params = (appVersion, packageHash) => ({ appVersion, clientUniqueId, packageHash, deploymentKey: stagingKey });

        before(() => {
            return appBL.createApp({ email, name }).then(a => {
                return dao.deploymentByApp(a.id, "Staging").then(deployment => {
                    stagingKey = deployment.key;
                });
            });
        });

        it("should target only specific version, 1.2.3", () => {
            return appBL
              .upload(myPackage("1.2.3", "Some-package-content, foo-bar-1"))
              .then(pkg => {
                return ac
                  .updateCheck(params("1.2.5", "ABCD"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("1.2.3", "ABCD"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should target any patch version but fixed major/minor version, 1.2.x", () => {
            return appBL
              .upload(myPackage("1.2.x", "Some package content, foo-bar, foobar-222"))
              .then(pkg => {
                return ac
                  .updateCheck(params("1.1.5", "ABCD"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("1.2.9", "ABCD"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should target specific range: 1.3.3 - 1.3.7", () => {
            return appBL
              .upload(myPackage("1.3.3 - 1.3.7", "foo-bar, Some package content, foobar"))
              .then(pkg => {
                return ac
                  .updateCheck(params("1.3.2", "ABCDEF"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("1.3.7", "ABCDEFGH"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should target specific range: >=2.4.3 <2.4.7", () => {
            return appBL
              .upload(myPackage(">=2.4.3 <2.4.7", "Some package content"))
              .then(pkg => {
                return ac
                  .updateCheck(params("2.4.7", "ABCDE"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("2.4.3", "ABCDFG"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should target any patch version, 3.2", () => {
            return appBL
              .upload(myPackage("3.2", "Some package content"))
              .then(pkg => {
                return ac
                  .updateCheck(params("3.3", "ABCDI"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("3.2.45", "ABCDH"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should target specific minor but any patch version, ~4.2.3", () => {
            return appBL
              .upload(myPackage("~4.2.3", "Some package content"))
              .then(pkg => {
                return ac
                  .updateCheck(params("4.3.3", "ABCDXY"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("4.2.35", "ABCDZKL"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should target any minor/patch version, ^5.2.3", () => {
            return appBL
              .upload(myPackage("^5.2.3", "Some package content"))
              .then(pkg => {
                return ac
                  .updateCheck(params("5.1.3", "ABCDMLO"))
                  .then(result => {
                    expect(result.isAvailable).false;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("5.25.75", "ABCDPQR"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("5.70.5", "ABCDPLXC"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              });
        });

        it("should upload two packages and test the semver criteria, ^6.0.0, ^7.0.0", () => {
            return appBL
              .upload(myPackage("^6.0.0", "Some package content, foo bar, label-6 for v6"))
              .then(pkg => {
                return appBL
                  .upload(myPackage("^7.0.0", "Some exclusive package content and foo-bar, foo bar, label-7 for v7"))
                  .then(pkg => {
                    return ac
                      .updateCheck(params("6.0.2", "ZAXBYCDPQR"))
                      .then(result => {
                        expect(result.isAvailable).true;
                        expect(result.appVersion).to.be.eq("^6.0.0");
                      });
                  });
              });
        });

        it("should target any device configured to consume updates, *", () => {
            return appBL
              .upload(myPackage("*", "Some-package-content, foo-bar-1-**-foobar"))
              .then(pkg => {
                return ac
                  .updateCheck(params("7.2.15", "ABCDUVRE"))
                  .then(result => {
                    expect(result.isAvailable).true;
                  });
              })
              .then(pkg => {
                return ac
                  .updateCheck(params("9.22.3", "ABCDYUG"))
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
        const clientUniqueId = "198u2irjwekhr1j901";

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
