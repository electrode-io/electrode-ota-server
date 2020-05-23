import initDao, {
  shutdown
} from "electrode-ota-server-test-support/lib/init-dao";
import eql from "electrode-ota-server-test-support/lib/eql";
import { expect } from "chai";

function alwaysFail() {
  throw new Error(`should have failed`);
}

describe("dao/cassandra", function() {
  this.timeout(200000);
  let dao;
  before(async () => (dao = await initDao()));
  after(shutdown);

  it("should insert user", () =>
    dao.createUser({ email: "joe@b.com", name: "Joe" }).then(user => {
      expect(user.email).to.eql("joe@b.com");
      expect(user.linkedProviders).to.eql(["GitHub"]);
      expect(user.name).to.eql("Joe");
      expect(user.id).to.exist;
    }));

  it("should fail insert user", () =>
    dao
      .createUser({ email: "joe@b.com", name: "Joe" })
      .then(_ => dao.createUser({ email: "joe@b.com", name: "Joe" }))
      .then(alwaysFail, e => {
        expect(e.message).eql("User already exists joe@b.com");
      }));

  it("should insert and update keys", () =>
    dao
      .createUser({
        email: "joe1@b.com",
        name: "Joe",
        accessKeys: { abc: { name: "key" } }
      })
      .then(user => {
        expect(user.accessKeys)
          .to.have.property("abc")
          .with.property("name", "key");
        user.accessKeys.abc.name = "abc";
        user.accessKeys.def = { name: "def" };
        return dao
          .updateUser(user.email, user)
          .then(u => u.accessKeys)
          .then(
            eql({
              abc: {
                name: "abc",
                expires: null,
                description: null,
                lastAccess: null,
                createdTime: null,
                createdBy: null,
                friendlyName: null,
                id: null
              },
              def: {
                name: "def",
                expires: null,
                description: null,
                createdTime: null,
                lastAccess: null,
                createdBy: null,
                friendlyName: null,
                id: null
              }
            })
          );
      }));
  it(`should find user based on accessKey`, () =>
    dao
      .createUser({
        email: "joe2@b.com",
        name: "Joe",
        accessKeys: { abc123: { name: "key" } }
      })
      .then(u =>
        dao
          .userByAccessKey("abc123")
          .then(fu => expect(fu.id.toJSON()).to.eql(u.id.toJSON()))
      ));

  it("should add an app and find by collaborators", () =>
    dao
      .createApp({
        name: "Hello",
        deployments: {
          staging: {
            key: "123"
          }
        },
        collaborators: { "test@t.com": { permission: "Owner" } }
      })
      .then(app => {
        const { id } = app;

        return dao
          .appsForCollaborator("test@t.com")
          .then(all =>
            expect(JSON.stringify(all[0].id)).to.eql(JSON.stringify(id))
          );
      }));
  it("should add/remove/rename deployments", () =>
    dao
      .createApp({
        name: "Hello",
        deployments: {
          staging: {
            key: "123"
          }
        },
        collaborators: { "test@t.com": { permission: "Owner" } }
      })
      .then(app => {
        const appId = app.id;
        const getApp = () => dao.appById(appId);

        return dao
          .addDeployment(appId, "stuff", { key: "stuff" })
          .then(getApp)
          .then(
            eql({
              collaborators: {
                "test@t.com": {
                  permission: "Owner"
                }
              },
              deployments: ["staging", "stuff"],
              name: "Hello"
            })
          )
          .then(_ => dao.removeDeployment(appId, "staging"))
          .then(getApp)
          .then(
            eql({
              collaborators: {
                "test@t.com": {
                  permission: "Owner"
                }
              },
              deployments: ["stuff"],
              name: "Hello"
            })
          )
          .then(_ => dao.renameDeployment(appId, "stuff", "newStuff"))
          .then(getApp)
          .then(res => {
            expect(res.deployments).to.eql(["newStuff"]);
          })
          .then(_ => dao.removeDeployment(appId, "newStuff"))
          .then(getApp)
          .then(res => {
            expect(res.deployments).to.eql(null);
          });
      }));

  it("should find an app based on name and user", () =>
    dao
      .createApp({
        name: "Hello",
        deployments: {
          staging: {
            key: "123"
          }
        },
        collaborators: { "test@t.com": { permission: "Owner" } }
      })
      .then(_ =>
        dao.createApp({
          name: "Hello",
          deployments: {
            staging: {
              key: "123"
            }
          },
          collaborators: { "test@nt.com": { permission: "Owner" } }
        })
      )
      .then(_ =>
        dao.appForCollaborator("test@nt.com", "Hello").then(app => {
          expect(app.name).to.eql("Hello");
          expect(Object.keys(app.collaborators)).to.eql(["test@nt.com"]);
        })
      ));

  it("should add a package to a deployment", () => {
    return dao
      .createApp({
        name: "Hello",
        deployments: {
          staging: {
            key: "123"
          }
        },
        collaborators: { "test@t.com": { permission: "Owner" } }
      })
      .then(app => {
        return dao.addPackage("123", {
          packageHash: "abc",
          description: "This is a package"
        });
      })
      .then(_ => dao.deploymentForKey("123"))
      .then(dep => {
        expect(dep.package.description).to.eql("This is a package");
      });
  });
  it("should add remove an app with a deployment", () => {
    return dao
      .createApp({
        name: "Hello",
        deployments: {
          staging: {
            key: "123"
          },
          other: {
            key: "456"
          }
        },
        collaborators: { "addremove@t.com": { permission: "Owner" } }
      })
      .then(app =>
        dao
          .addPackage("123", {
            packageHash: "abc",
            description: "This is a package"
          })
          .then(_ => dao.removeApp(app.id))
          .then(_ => dao.appsForCollaborator("addremove@t.com"))
      )
      .then(apps => expect(apps).to.eql([]));
  });
  it("should get deployments by keys", () =>
    dao
      .createApp({
        name: "Hello",
        deployments: {
          staging: {
            key: "123"
          },
          other: {
            key: "456"
          }
        },
        collaborators: { "test@t.com": { permission: "Owner" } }
      })
      .then(app => dao.deploymentsByApp(app.id, app.deployments))
      .then(deployments => {
        expect(deployments.staging).to.exist;
        expect(deployments.other).to.exist;
      }));

  describe("getNewestApplicablePackage", () => {
    const email = "test@unit-test.com";
    let app;
    let stagingKey = "2f0fnni10fn1n13nf";
    let productionKey = "490u034hg09j19g20";
    let pkg1, pkg2, pkg3, pkg4, pkg5;

    before(() => {
      return dao
        .createApp({
          name: "TestApp",
          deployments: {
            Staging: {
              key: stagingKey
            },
            Production: {
              key: productionKey
            }
          },
          collaborators: {
            "test@unit-test.com": {
              permission: "Owner"
            }
          }
        })
        .then(a => {
          app = a;
        });
    });

    it("will return no package if there are no matching releases", () => {
      return dao
        .getNewestApplicablePackage(stagingKey, undefined)
        .then(newest => {
          expect(newest).to.be.undefined;
        });
    });

    it("will return a release with no tags if that release is the most up-to-date release", () => {
      pkg1 = {
        appVersion: "1.0.0",
        blobUrl: "http://stuff.com/package1",
        packageHash: "2930fj2j923892f9h9f831899182889hf",
        isDisabled: false,
        isMandatory: false,
        label: "v1",
        manifestBlobUrl: "http://stuff.com/manifest1",
        rollout: 100,
        size: 1500,
        releaseMethod: "Upload",
        releasedBy: email
      };

      return dao.addPackage(stagingKey, pkg1).then(() => {
        return dao
          .getNewestApplicablePackage(stagingKey, undefined)
          .then(newest => {
            expect(newest).not.to.be.undefined;
            expect(newest.packageHash).to.eq(pkg1.packageHash);
          });
      });
    });

    it("will return a release with no tags if none of the incoming tags match", () => {
      pkg2 = {
        appVersion: "1.0.0",
        blobUrl: "http://stuff.com/package2",
        packageHash: "jnowfim20m3@@#%FMM@FK@K",
        isDisabled: false,
        isMandatory: false,
        label: "v2",
        manifestBlobUrl: "http://stuff.com/manifest2",
        rollout: 100,
        size: 1600,
        tags: ["TAG-1", "TAG-2"],
        releaseMethod: "Upload",
        releasedBy: email
      };

      return dao.addPackage(stagingKey, pkg2).then(() => {
        return dao
          .getNewestApplicablePackage(stagingKey, undefined)
          .then(newest => {
            expect(newest).not.to.be.undefined;
            expect(newest.packageHash).to.eq(pkg1.packageHash);
          })
          .then(() => {
            return dao
              .getNewestApplicablePackage(stagingKey, ["TAG-3"])
              .then(newest => {
                expect(newest).not.to.be.undefined;
                expect(newest.packageHash).to.eq(pkg1.packageHash);
              });
          });
      });
    });

    it("will return a release with tags if at least one incoming tag matches", () => {
      return dao
        .getNewestApplicablePackage(stagingKey, ["TAG-1", "TAG-3"])
        .then(newest => {
          expect(newest).not.to.be.undefined;
          expect(newest.packageHash).to.eq(pkg2.packageHash);
        });
    });

    it("will return a release if there is an intermediate release that matches the incoming tags", () => {
      pkg3 = Object.assign({}, pkg1, {
        packageHash: "fion2ff@F#@NN@!@9100j1n1",
        blobUrl: "https://stuff.com/package3",
        manifestBlobUrl: "https://stuff.com/manifest3",
        size: 1700,
        label: "v3",
        tags: ["TAG-4", "TAG-5", "TAG-6"]
      });

      return dao.addPackage(stagingKey, pkg3).then(() => {
        /*

                Now we have in the table

                pkg3 - ["TAG-4", "TAG-5", "TAG-6"]
                pkg2 - ["TAG-1", "TAG-2"]
                pgk1 - no tags

                */

        return dao
          .getNewestApplicablePackage(stagingKey, ["TAG-2"])
          .then(newest => {
            expect(newest).not.to.be.undefined;
            expect(newest.packageHash).to.eq(pkg2.packageHash);
          });
      });
    });

    it("will return a release if there is an intermediate release with no tags", () => {
      pkg4 = Object.assign({}, pkg1, {
        packageHash: "wfn2i0f02390239gnbr2",
        blobUrl: "https://stuff.com/package4",
        manifestBlobUrl: "https://stuff.com/manifest4",
        size: 1800,
        label: "v4"
      });

      return dao.addPackage(stagingKey, pkg4).then(() => {
        pkg5 = Object.assign({}, pkg1, {
          packageHash: "aio059gn2nf30920910189",
          blobUrl: "https://stuff.com/package5",
          manifestBlobUrl: "https://stuff.com/manifest5",
          size: 9800,
          label: "v5",
          tags: ["TAG-10", "TAG-11", "TAG-12", "TAG-13", "TAG-14"]
        });

        return dao.addPackage(stagingKey, pkg5).then(() => {
          /*

                    Now we have in the table

                    pkg5 - ["TAG-10", "TAG-11", "TAG-12", "TAG-13", "TAG-14"]
                    pkg4 - no tags
                    pkg3 - ["TAG-4", "TAG-5", "TAG-6"]
                    pkg2 - ["TAG-1", "TAG-2"]
                    pkg1 - no tags

                    */

          return dao.getNewestApplicablePackage(stagingKey, []).then(newest => {
            expect(newest).not.to.be.undefined;
            expect(newest.packageHash).to.eq(pkg4.packageHash);
          });
        });
      });
    });
    it("will return a release matching specified appVersion", () => {
      const versionToCheck = "1.1.0";
      const v1pkg = Object.assign({}, pkg1, {
        appVersion: versionToCheck,
        packageHash: "2930fj2j923892f9h9f831899182889hf",
        label: "v1"
      });
      const v2pkg = Object.assign({}, v1pkg, {
        appVersion: "1.2.0",
        packageHash: "ABCDEFG",
        label: "v2"
      });
      return dao
        .addPackage(stagingKey, v1pkg)
        .then(() => {
          return dao.addPackage(stagingKey, v2pkg);
        })
        .then(() => {
          return dao
            .getNewestApplicablePackage(stagingKey, [], versionToCheck)
            .then(release => {
              expect(release).not.be.undefined;
              expect(release.packageHash).to.eq(v1pkg.packageHash);
            });
        });
    });
    it("will return latest release matching specified appVersion", () => {
      const versionToCheck = "1.3.0";
      const v1apkg = Object.assign({}, pkg1, {
        appVersion: versionToCheck,
        packageHash: "ABCDEF1234",
        label: "v1"
      });
      const v1bpkg = Object.assign({}, v1apkg, {
        appVersion: versionToCheck,
        packageHash: "ABCDEF7890",
        label: "v2"
      });
      const v2pkg = Object.assign({}, v1apkg, {
        appVersion: "1.4.0",
        packageHash: "EDCBA44321",
        label: "v3"
      });
      return dao
        .addPackage(stagingKey, v1apkg)
        .then(() => {
          return dao.addPackage(stagingKey, v1bpkg);
        })
        .then(() => {
          return dao.addPackage(stagingKey, v2pkg);
        })
        .then(() => {
          return dao
            .getNewestApplicablePackage(stagingKey, [], versionToCheck)
            .then(release => {
              expect(release).not.be.undefined;
              expect(release.packageHash).to.eq(v1bpkg.packageHash);
            });
        });
    });
    it("will return latest release for unmatched appVersion", () => {
      const versionToCheck = "1.8.0";
      const v1pkg = Object.assign({}, pkg1, {
        appVersion: "1.7.0",
        packageHash: "ACEBDF135246",
        label: "v1"
      });
      const v2pkg = Object.assign({}, pkg1, {
        appVersion: "1.9.0",
        packageHash: "A1C3E5B2D4F6",
        label: "v2"
      });
      return dao
        .addPackage(stagingKey, v1pkg)
        .then(() => {
          return dao.addPackage(stagingKey, v2pkg);
        })
        .then(() => {
          return dao
            .getNewestApplicablePackage(stagingKey, [], versionToCheck)
            .then(release => {
              expect(release).not.be.undefined;
              expect(release.packageHash).to.eq(v2pkg.packageHash);
            });
        });
    });
  });

  describe("metrics", () => {
    it("test metrics by stats", () => {
      const deploymentKey = "metricAppKey";
      return dao
        .createApp({
          name: "metricApp",
          deployments: {
            staging: {
              key: deploymentKey
            }
          },
          collaborators: {}
        })
        .then(app => {
          const metricData = [
            {
              appVersion: "1.0.0",
              status: "Downloaded",
              label: "v1",
              deploymentKey: deploymentKey,
              clientUniqueId: "1"
            },
            {
              appVersion: "1.0.0",
              status: "Downloaded",
              label: "v1",
              deploymentKey: deploymentKey,
              clientUniqueId: "1"
            },
            {
              appVersion: "1.0.0",
              status: "DeploymentSuccess",
              label: "v2",
              deploymentKey: deploymentKey,
              clientUniqueId: "1"
            },
            {
              appVersion: "1.0.0",
              status: "DeploymentSuccess",
              label: "v2",
              deploymentKey: deploymentKey,
              clientUniqueId: "1"
            },
            {
              appVersion: "1.0.0",
              status: "DeploymentFailed",
              label: "v2",
              deploymentKey: deploymentKey,
              clientUniqueId: "1"
            }
          ];
          return Promise.all(
            metricData.map(metric => dao.insertMetric(metric))
          );
        })
        .then(() => dao.metricsByStatus(deploymentKey))
        .then(metrics => {
          expect(metrics.length).to.eq(3);
          const expectMetric = (status, label, appversion, total) => {
            const downloadStatus = metrics.find(m => m.status === status);
            expect(downloadStatus).not.to.be.undefined;
            expect(downloadStatus.appversion).to.eq(appversion);
            expect(downloadStatus.label).to.eq(label);
            expect(downloadStatus.total).to.eq(total);
          };
          expectMetric("Downloaded", "v1", "1.0.0", 2);
          expectMetric("DeploymentSuccess", "v2", "1.0.0", 2);
          expectMetric("DeploymentFailed", "v2", "1.0.0", 1);
        });
    });
  });
});
