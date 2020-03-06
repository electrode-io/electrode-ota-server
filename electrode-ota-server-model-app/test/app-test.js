/* eslint-disable max-statements */
import initDao, { shutdown } from "electrode-ota-server-test-support/lib/init-maria-dao";
import eql from "electrode-ota-server-test-support/lib/eql";
import path from "path";
import fs from "fs";
import yazl from "yazl";
import appFactory from "electrode-ota-server-model-app/lib/app";
import accountFactory from "electrode-ota-server-model-account/lib/account";
import { fileservice as upload } from "electrode-ota-server-fileservice-upload";
import { manifestHash } from "electrode-ota-server-model-manifest/lib/manifest";
import { shasum } from "electrode-ota-server-util";
import { expect } from "chai";
import step0Manifest from "./fixtures/step.0.manifest.json";

const ONE_MIN = 1000; //in millisecond
const ONE_SECOND = 60;

const fixture = path.join.bind(path, __dirname, "fixtures");
const readFixture = file => fs.readFileSync(fixture(file));

const shouldError = () => {
  // eslint-disable-next-line no-unused-expressions
  expect(false, "Should have an error").to.be.true;
};
const APP = {
  email: "test@p.com",
  app: "super"
};

let metricSummaryDeployment;
let metricSummaryApp = {
  appName: "myApp",
  email: "cached_summary@walmart.com",
  deploymentType: "Staging"
};

describe("model/app", function() {
  this.timeout(50000);
  let account, ac, dao;

  const createAccount = (email, name = "joe") => {
    return account.createToken({
      profile: { email, name },
      provider: "GitHub"
    });
  };

  const createZip = content => {
    let zf = new yazl.ZipFile();
    let output = [];
    zf.outputStream.on("data", c => output.push(c));
    let piss = new Promise(resolve => {
      zf.outputStream.on("end", () => {
        const buf = Buffer.concat(output);
        resolve(buf);
      });
    });
    zf.addBuffer(Buffer.from(content), "yo.txt");
    zf.end();
    return piss;
  };

  before(async () => {
    dao = await initDao({}, console);
    let w = 0;
    account = accountFactory({}, dao, console);
    const up = upload({}, dao);
    ac = appFactory({}, dao, up, console);
    await createAccount(APP.email, "test");
  });

  after(shutdown);

  it("should create/list/remove an app", () => {
    const email = "test@p.com";
    return ac
      .createApp({ email, name: "super" })
      .then(
        eql({
          collaborators: {
            "test@p.com": {
              permission: "Owner"
            }
          },
          deployments: ["Production", "Staging"],
          name: "super"
        })
      )

      .then(_ => ac.listApps(APP))
      .then(apps => expect(apps.length).to.eql(1))
      .then(_ => ac.renameApp({ email, app: "super", name: "duper" }))
      .then(_ => ac.removeApp({ email, app: "duper" }))
      .then(_ => ac.listApps(APP))
      .then(apps => expect(apps.length).to.eql(0));
  });
  it("should add/rename/remove deployment", () => {
    const email = "deployment@p.com";
    const app = "deployment";
    return createAccount(email, "deploy")
      .then(() => ac.createApp({ email, name: "deployment" }))
      .then(_ => ac.listDeployments({ email, app }))
      .then(deps => {
        expect(deps)
          .to.be.an("array")
          .with.length(2);
      })
      .then(_ => ac.removeDeployment({ email, deployment: "Staging", app }))

      .then(_ => ac.listDeployments({ email, app }))
      .then(deps => {
        expect(deps)
          .to.be.an("array")
          .length(1);
      })
      .then(_ => ac.addDeployment({ email, app, name: "what" }))
      .then(_ => ac.listDeployments({ email, app }))
      .then(deps => {
        expect(deps.length).to.eql(2);
      })
      .then(_ => ac.renameDeployment({ email, app, deployment: "what", name: "sowhat" }))
      .then(_ => ac.listDeployments({ email, app }))
      .then(deps => {
        expect(deps.length).to.eql(2);
      });
  });
  it("should upload and promote", () => {
    const email = "test@p.com";

    return ac
      .createApp({ email, name: "superd" })
      .then(_ => createZip(`Zipped package to upload`))
      .then(pkg => {
        return ac.upload({
          app: "superd",
          email,
          package: pkg,
          packageInfo: {
            isDisabled: true,
            rollout: 25,
            isMandatory: true,
            description: "Super Cool"
          }
        });
      })
      .then(_ => createZip(`Another zipped package to upload`))
      .then(pkg => {
        return ac.upload({
          app: "superd",
          email,
          package: pkg,
          packageInfo: {
            appVersion: "1.0.2",
            rollout: 50,
            isMandatory: true,
            description: "Not Super Cool"
          }
        });
      })
      .then(_ => {
        return ac.historyDeployment({
          app: "superd",
          deployment: "Staging",
          email
        });
      })
      .then(v => {
        expect(v.length, "should be 2").to.eql(2);
        v.forEach(v => {
          expect(delete v.uploadTime).to.be.true;
          delete v.lastUpdated;
        });
        return v;
      })
      .then(
        eql([
          {
            appVersion: "1.0.2",
            blobUrl: "b8fb2583c7c33e0ab01c50ae3bacbba74a380f5316fa329da52f0a818312eb4f",
            description: "Not Super Cool",
            diffPackageMap: {},
            isDisabled: false,
            isMandatory: true,
            label: "v2",
            originalDeployment: null,
            originalLabel: null,
            manifestBlobUrl: "fef54b6971e2b5008be8b1e805ce86f2b837de69be45b50eea465ba1818b4544",
            packageHash: "b8fb2583c7c33e0ab01c50ae3bacbba74a380f5316fa329da52f0a818312eb4f",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 50,
            size: 144
          },
          {
            appVersion: "1.0.0",
            blobUrl: "e9f5494b6434ec91c6dac80d66da461d056ceaa6b9b65bad93a98cf03f8f1880",
            description: "Super Cool",
            diffPackageMap: {},
            isDisabled: true,
            isMandatory: true,
            label: "v1",
            manifestBlobUrl: "c0df7b5ee9d68548a4d17291762f94ba9b2326a448f7ce84c5eced52b8561917",
            originalDeployment: null,
            originalLabel: null,
            packageHash: "e9f5494b6434ec91c6dac80d66da461d056ceaa6b9b65bad93a98cf03f8f1880",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 25,
            size: 136
          }
        ])
      )
      .then(_ =>
        ac.promoteDeployment({
          app: "superd",
          email,
          deployment: "Staging",
          to: "Production"
        })
      )
      .then(_ => ac.historyDeployment({ app: "superd", email, deployment: "Production" }))
      .then(v => {
        expect(v.length, "should be 1").to.eql(1);
        v.forEach(v => {
          delete v.uploadTime;
          delete v.lastUpdated;
        });
        return v[0];
      })
      .then(
        eql({
          appVersion: "1.0.2",
          blobUrl: "b8fb2583c7c33e0ab01c50ae3bacbba74a380f5316fa329da52f0a818312eb4f",
          description: "Not Super Cool",
          diffPackageMap: {},
          isDisabled: false,
          isMandatory: true,
          label: "v1",
          manifestBlobUrl: "fef54b6971e2b5008be8b1e805ce86f2b837de69be45b50eea465ba1818b4544",
          originalDeployment: "Staging",
          originalLabel: "v2",
          releaseMethod: "Promote",
          releasedBy: "test@p.com",
          rollout: null,
          size: 144,
          packageHash: "b8fb2583c7c33e0ab01c50ae3bacbba74a380f5316fa329da52f0a818312eb4f"
        })
      )
      .then(dep =>
        ac.updateDeployment({
          email,
          deployment: "Production",
          app: "superd",
          appVersion: "1.2.3",
          isDisabled: true,
          isMandatory: true,
          rollout: 50
        })
      )
      .then(dep => {
        //not part of api
        delete dep.created_;
        //part of api
        expect(delete dep.uploadTime).to.be.true;
        delete dep.lastUpdated;
        return dep;
      })
      .then(
        eql({
          appVersion: "1.2.3",
          blobUrl: "b8fb2583c7c33e0ab01c50ae3bacbba74a380f5316fa329da52f0a818312eb4f",
          description: "Not Super Cool",
          diffPackageMap: {},
          isDisabled: true,
          isMandatory: true,
          manifestBlobUrl: "fef54b6971e2b5008be8b1e805ce86f2b837de69be45b50eea465ba1818b4544",
          label: "v1",
          originalDeployment: "Staging",
          originalLabel: "v2",
          packageHash: "b8fb2583c7c33e0ab01c50ae3bacbba74a380f5316fa329da52f0a818312eb4f",
          releaseMethod: "Promote",
          releasedBy: "test@p.com",
          rollout: 50,
          size: 144
        })
      );
  });

  it("should upload with short version 2.0", () => {
    const email = "test@short_version.com";
    return createAccount(email, "ver")
      .then(() => ac.createApp({ email, name: "short_version" }))
      .then(_ => createZip(`Some short version 2.0 content`))
      .then(pkg =>
        ac.upload({
          app: "short_version",
          email,
          package: pkg,
          packageInfo: {
            appVersion: "2.0",
            description: "Short app-version test"
          }
        })
      )
      .then(_ =>
        ac.historyDeployment({
          app: "short_version",
          deployment: "Staging",
          email
        })
      )
      .then(pkg => {
        expect(pkg.length).eq(1);
        expect(pkg[0].appVersion).eq("2.0");
        expect(pkg[0].description).eq("Short app-version test");
      });
  });

  it("disallow promote of same bundle", () => {
    const email = "swaggypromote@gmail.com";
    const appName = "disallowSameBundle";

    return createAccount(email, "swaggypromot")
      .then(_ => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`some bundle`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "release me"
          }
        })
      )
      .then(() =>
        ac.promoteDeployment({
          app: appName,
          email,
          deployment: "Staging",
          to: "Production"
        })
      )
      .then(() =>
        ac.promoteDeployment({
          app: appName,
          email,
          deployment: "Staging",
          to: "Production"
        })
      )
      .then(
        () => expect.fail("Should have failed"),
        err =>
          expect(err).to.have.property(
            "message",
            "Deployment Staging:v1 has already been promoted to Production:v1."
          )
      );
  });

  it("allow promote of same bundle for different app versions", () => {
    const email = "swaggychamp@gmail.com";
    const appName = "allowSameBundleDifferentAppVersion";
    let firstLabel = "";
    let secondLabel = "";
    return createAccount(email, "champ")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`same bundle different versions`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "version 1",
            appVersion: "1.0.0"
          }
        })
      )
      .then(dep => {
        firstLabel = dep.label;
      })
      .then(_ => createZip(`sample bundle version 2`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "version 2",
            appVersion: "2.0.0"
          }
        })
      )
      .then(dep => {
        secondLabel = dep.label;
      })
      .then(() =>
        ac.promoteDeployment({
          app: appName,
          email,
          deployment: "Staging",
          to: "Production",
          label: firstLabel
        })
      )
      .then(() =>
        ac.promoteDeployment({
          app: appName,
          email,
          deployment: "Staging",
          to: "Production",
          label: secondLabel
        })
      );
  });

  it("should rollback to last", () => {
    const email = "test@p.com";
    return ac
      .createApp({ email, name: "rollback" })
      .then(_ => createZip(`This is a string`))
      .then(pkg =>
        ac.upload({
          app: "rollback",
          email,
          package: pkg,
          packageInfo: {
            isDisabled: true,
            rollout: 25,
            isMandatory: true,
            description: "Super Cool"
          }
        })
      )
      .then(_ => createZip(`This is a different string`))
      .then(pkg =>
        ac.upload({
          app: "rollback",
          email,
          package: pkg,
          packageInfo: {
            appVersion: "1.0.2",
            rollout: 50,
            isMandatory: true,
            description: "Not Super Cool"
          }
        })
      )
      .then(_ => ac.rollback({ email, app: "rollback", deployment: "Staging" }))
      .then(_ => ac.historyDeployment({ email, app: "rollback", deployment: "Staging" }))
      .then(history => {
        expect(history, "history length")
          .to.be.an("array")
          .with.length(3);
        history.forEach(v => {
          expect(delete v.uploadTime, "should have uploadTime").to.be.true;
          delete v.lastUpdated;
        });
        return history;
      })
      .then(
        eql([
          {
            appVersion: "1.0.0",
            description: "Super Cool",
            diffPackageMap: {},
            isDisabled: true,
            isMandatory: true,
            label: "v3",
            originalDeployment: null,
            manifestBlobUrl: "97ff01925b85e2a51cfb0e26d468914599e1212f7d234f823c2c2cf9ac806e9e",
            originalLabel: "v1",
            packageHash: "95c531cd4ea137d07e7afa9a8f4a48dd101b5f60d8a74bd4f3a1cb534d899307",
            blobUrl: "95c531cd4ea137d07e7afa9a8f4a48dd101b5f60d8a74bd4f3a1cb534d899307",

            releaseMethod: "Rollback",
            releasedBy: "test@p.com",
            rollout: 100,
            size: 126
          },
          {
            appVersion: "1.0.2",
            description: "Not Super Cool",
            diffPackageMap: {},
            isDisabled: false,
            isMandatory: true,
            manifestBlobUrl: "e3e0f766cabc8ad8d9e3dc71ecb17236add2702947f015024e5cef4f3ceecbfb",
            label: "v2",
            originalDeployment: null,
            originalLabel: null,
            packageHash: "9d00bcaa96c59928d148aa36bb7c38b5a9b70b3056d67ba7ec9e2e453b928658",
            blobUrl: "9d00bcaa96c59928d148aa36bb7c38b5a9b70b3056d67ba7ec9e2e453b928658",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 50,
            size: 136
          },
          {
            appVersion: "1.0.0",
            description: "Super Cool",
            diffPackageMap: {},
            isDisabled: true,
            manifestBlobUrl: "97ff01925b85e2a51cfb0e26d468914599e1212f7d234f823c2c2cf9ac806e9e",
            isMandatory: true,
            label: "v1",
            originalDeployment: null,
            originalLabel: null,
            blobUrl: "95c531cd4ea137d07e7afa9a8f4a48dd101b5f60d8a74bd4f3a1cb534d899307",
            packageHash: "95c531cd4ea137d07e7afa9a8f4a48dd101b5f60d8a74bd4f3a1cb534d899307",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 25,
            size: 126
          }
        ])
      );
  });
  it("should rollback to label", () => {
    const email = "test@p.com";
    return ac
      .createApp({ email, name: "rollbackToLabel" })
      .then(_ => createZip(`This is a rollback string`))
      .then(pkg =>
        ac.upload({
          app: "rollbackToLabel",
          email,
          package: pkg,
          packageInfo: {
            isDisabled: true,
            rollout: 25,
            isMandatory: true,
            description: "Super Cool"
          }
        })
      )
      .then(_ => createZip(`This is another rollback string`))
      .then(pkg =>
        ac.upload({
          app: "rollbackToLabel",
          email,
          package: pkg,
          packageInfo: {
            appVersion: "1.0.2",
            rollout: 50,
            isMandatory: true,
            description: "Not Super Cool"
          }
        })
      )
      .then(_ =>
        ac.rollback({
          email,
          app: "rollbackToLabel",
          deployment: "Staging",
          label: "v1"
        })
      )
      .then(_ =>
        ac.historyDeployment({
          email,
          app: "rollbackToLabel",
          deployment: "Staging"
        })
      )
      .then(history => {
        expect(history.length, "history length").to.eql(3);
        history.forEach(v => {
          expect(delete v.uploadTime, "should have uploadTime").to.be.true;
          delete v.lastUpdated;
        });
        return history;
      })
      .then(
        eql([
          {
            appVersion: "1.0.0",
            blobUrl: "f96293b842f1eaf5ca72b693abc1dead085a3d4fce0beceed3701c77b7193417",
            description: "Super Cool",
            diffPackageMap: {},
            isDisabled: true,
            manifestBlobUrl: "bb82ad6ea783dc1068254ce3d68aae5d0500c227881826f68a9d9b99374613e4",

            isMandatory: true,
            label: "v3",
            originalDeployment: null,
            originalLabel: "v1",
            packageHash: "f96293b842f1eaf5ca72b693abc1dead085a3d4fce0beceed3701c77b7193417",
            releaseMethod: "Rollback",
            releasedBy: "test@p.com",
            rollout: 100,
            size: 135
          },
          {
            appVersion: "1.0.2",
            blobUrl: "999d71e3e7b89a796f3714bb5d2e890f9aab27b5ccdd75d1269a68a9e620a0e6",
            description: "Not Super Cool",
            diffPackageMap: {},
            isDisabled: false,
            isMandatory: true,
            manifestBlobUrl: "4a5b60d8af17408862707d5734b02baf1400356271c6b99cc89a124a37bcf27b",
            label: "v2",
            originalDeployment: null,
            originalLabel: null,
            packageHash: "999d71e3e7b89a796f3714bb5d2e890f9aab27b5ccdd75d1269a68a9e620a0e6",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 50,
            size: 141
          },
          {
            appVersion: "1.0.0",
            blobUrl: "f96293b842f1eaf5ca72b693abc1dead085a3d4fce0beceed3701c77b7193417",
            description: "Super Cool",
            diffPackageMap: {},
            isDisabled: true,
            isMandatory: true,
            manifestBlobUrl: "bb82ad6ea783dc1068254ce3d68aae5d0500c227881826f68a9d9b99374613e4",
            label: "v1",
            originalDeployment: null,
            originalLabel: null,
            packageHash: "f96293b842f1eaf5ca72b693abc1dead085a3d4fce0beceed3701c77b7193417",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 25,
            size: 135
          }
        ])
      );
  });
  //const TOKEN = {profile: {email: 'test@t.com', name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}};

  it("should add/remove/transfer collabordators", () =>
    createAccount("what@p.com", "what")
      .then(() =>
        ac.createApp({
          email: "what@p.com",
          name: "addcollab"
        })
      )
      .then(_ =>
        ac
          .addCollaborator({
            email: "what@p.com",
            app: "addcollab",
            collaborator: "stuff@p.com"
          })
          .then(shouldError, e => {
            expect(e.message).to.eql(`No user found with email [stuff@p.com]`);
            return null;
          })
      )
      .then(_ =>
        account.createToken({
          profile: { email: "stuff@p.com", name: "test" },
          query: { hostname: "TestHost" },
          provider: "GitHub"
        })
      )
      .then(_ =>
        ac.addCollaborator({
          email: "what@p.com",
          app: "addcollab",
          collaborator: "stuff@p.com"
        })
      )
      .then(_ => ac.findApp({ email: "what@p.com", app: "addcollab" }))
      .then(
        eql({
          collaborators: {
            "what@p.com": {
              permission: "Owner"
            },
            "stuff@p.com": {
              permission: "Collaborator"
            }
          },
          deployments: ["Production", "Staging"],
          name: "addcollab"
        })
      )
      .then(_ =>
        ac
          .removeCollaborator({
            email: "what@p.com",
            app: "addcollab",
            collaborator: "what@p.com"
          })
          .then(shouldError, e => {
            expect(e.message).to.eql("Cannot remove the owner of the app from collaborator list.");
            return null;
          })
      )
      .then(_ =>
        ac
          .removeCollaborator({
            email: "stuff@p.com",
            app: "addcollab",
            collaborator: "what@p.com"
          })
          .then(shouldError, e => {
            expect(e.message).to.eql("Must be owner to remove a collaborator");
            return null;
          })
      )
      .then(_ =>
        ac.removeCollaborator({
          email: "what@p.com",
          app: "addcollab",
          collaborator: "stuff@p.com"
        })
      )
      .then(_ => ac.findApp({ email: "what@p.com", app: "addcollab" }))
      .then(
        eql({
          collaborators: {
            "what@p.com": {
              permission: "Owner"
            }
          },
          deployments: ["Production", "Staging"],
          name: "addcollab"
        })
      )
      //can't transfer to an unknown account.
      .then(_ =>
        ac
          .transferApp({
            email: "what@p.com",
            app: "addcollab",
            transfer: "dne@p.com"
          })
          .then(shouldError, e => {
            expect(e.message).to.eql(`No user found with email [dne@p.com]`);
          })
      )
      .then(_ =>
        ac.transferApp({
          email: "what@p.com",
          app: "addcollab",
          transfer: "stuff@p.com"
        })
      )
      .then(_ => ac.listApps({ email: "what@p.com" }))
      .then(eql([]))
      .then(_ => ac.listApps({ email: "stuff@p.com" }))
      .then(
        eql([
          {
            collaborators: {
              "stuff@p.com": {
                permission: "Owner"
              },
              "what@p.com": {
                permission: "Collaborator"
              }
            },
            deployments: ["Production", "Staging"],
            name: "addcollab"
          }
        ])
      ));

  it("should upload zipped app and create manifest", () => {
    const email = "zipper@walmart.com";
    const appName = "zipped_app";
    return createAccount(email, "zipper")
      .then(() => ac.createApp({ email, name: appName }))
      .then(() =>
        ac.upload({
          app: appName,
          email,
          package: readFixture("step.0.blob.zip"),
          packageInfo: {
            isDisabled: false,
            rollout: 100,
            isMandatory: false,
            description: "Zipped app"
          }
        })
      )
      .then(() =>
        ac.historyDeployment({
          app: appName,
          deployment: "Staging",
          email
        })
      )
      .then(v => {
        expect(v.length).to.eql(1);
        const expectedPackageHash = manifestHash(step0Manifest);
        const expectedManifestHash = shasum(JSON.stringify(step0Manifest));
        // PackageHash = sha256 hash of the manifest file in a specific format
        expect(v[0].packageHash).is.eql(expectedPackageHash);
        // blobUrl without a host prefix = sha256 of the manifest file
        expect(v[0].manifestBlobUrl).is.eql(expectedManifestHash);
      });
  });

  it("should reject duplicate upload", () => {
    const email = "duplicator@walmart.com";
    const appName = "duplicate_upload";
    let dupPackage;
    return createAccount(email, "duplicator")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`package to be duplicated`))
      .then(pkg => {
        dupPackage = pkg;
        return ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "First upload succeeds"
          }
        });
      })
      .then(() => {
        let hasException = false;
        return ac
          .upload({
            app: appName,
            email,
            deployment: "Staging",
            package: dupPackage,
            packageInfo: {
              description: "Second upload should fail"
            }
          })
          .catch(e => {
            hasException = true;
            expect(e).to.be.an(
              "error",
              "No changes detected in uploaded content for this deployment."
            );
          })
          .then(() => {
            expect(hasException, "Duplicate content Error expected").to.be.true;
          });
      });
  });

  it("allow duplicate upload for different versions", () => {
    const email = "dup_version@walmart.com";
    const appName = "duplicate_version_allowed";
    return createAccount(email, "dup")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`upload version 1`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "First upload succeeds",
            appVersion: "1.0.0"
          }
        })
      )
      .then(_ => createZip(`upload version 2`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "Second upload succeeds too",
            appVersion: "1.1.0"
          }
        })
      )
      .then(newPkg => {
        expect(newPkg).not.to.be.undefined;
        expect(newPkg.appVersion).to.eq("1.1.0");
      });
  });

  it("should handle tags on upload", () => {
    const email = "tagger@taggington.com";
    const appName = "appWillUseTags";
    const tags = ["SOCCER-MOMS", "NASCAR-DADS"];
    return createAccount(email, "tagger")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`tags package`))
      .then(pkg => {
        return ac
          .upload({
            app: appName,
            email,
            package: pkg,
            deployment: "Staging",
            packageInfo: {
              description: "release with tags",
              tags
            }
          })
          .then(newPkg => {
            expect(newPkg).not.to.be.undefined;
            expect(newPkg.tags).not.to.be.undefined;
            expect(newPkg.tags.length).to.eq(tags.length);
            expect(newPkg.tags.indexOf(tags[0])).to.be.gte(0);
            expect(newPkg.tags.indexOf(tags[1])).to.be.gte(0);
          });
      });
  });

  it("should handle tags on promote", () => {
    const email = "taggy@mctaggerson.com";
    const appName = "appWillUseTagsOnPromotion";
    const tags = ["SITE-1222"];

    return createAccount(email, "taggy")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`taggy package`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "release without tags"
          }
        })
      )
      .then(() =>
        ac.promoteDeployment({
          app: appName,
          email,
          deployment: "Staging",
          to: "Production",
          tags
        })
      )
      .then(promoted => {
        expect(promoted).not.to.be.undefined;
        expect(promoted.tags).not.to.be.undefined;
        expect(promoted.tags.length).to.eq(tags.length);
        expect(promoted.tags.indexOf(tags[0])).to.eq(0);
      });
  });

  it("should handle tags on update", () => {
    const email = "tag_updater@tagtronics.com";
    const appName = "appWillUpdateTags";
    const tags = ["SOUTHERN-US", "MIDWEST-US"];

    return createAccount(email, "tag")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`tags on update`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "release without tags initially"
          }
        })
      )
      .then(() =>
        ac.updateDeployment({
          app: appName,
          email,
          deployment: "Staging",
          tags
        })
      )
      .then(updated => {
        expect(updated).not.to.be.undefined;
        expect(updated.tags).not.to.be.undefined;
        expect(updated.tags.length).to.eq(tags.length);
        expect(updated.tags.indexOf(tags[0])).to.be.gte(0);
        expect(updated.tags.indexOf(tags[1])).to.be.gte(0);
      });
  });

  it("should updateDeployment for a label", () => {
    const email = "label@walmart.com";
    const appName = "updateDeploymentWithLabel";
    return createAccount(email, "label")
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`Package for v1`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "v1 description",
            label: "v1",
            rollout: 10,
            isDisabled: false
          }
        })
      )
      .then(_ => createZip(`Package for v2`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "v2 description",
            label: "v2",
            isDisabled: false,
            rollout: 11
          }
        })
      )
      .then(() =>
        ac.updateDeployment({
          app: appName,
          email,
          description: "v1 new description",
          deployment: "Staging",
          label: "v1",
          rollout: 99,
          isDisabled: true
        })
      )
      .then(updated => {
        expect(updated).not.to.be.undefined;
        expect(updated.label).to.eq("v1");
        expect(updated.isDisabled).to.be.true;
        expect(updated.rollout).to.eq(99);
        expect(updated.description).to.eq("v1 new description");
      })
      .then(() =>
        ac.historyDeployment({
          app: appName,
          email,
          deployment: "Staging"
        })
      )
      .then(history => {
        expect(history.length).to.eq(2);
        const v1 = history[1];
        expect(v1.label).to.eq("v1");
        expect(v1.isDisabled).to.be.true;
        expect(v1.rollout).to.eq(99);
        expect(v1.description).to.eq("v1 new description");
        const v2 = history[0];
        expect(v2.label).to.eq("v2");
        expect(v2.isDisabled).to.be.false;
        expect(v2.rollout).to.eq(11);
        expect(v2.description).to.eq("v2 description");
      });
  });

  it("should updateDeployment short appVersion", () => {
    const email = "short-version@walmart.com";
    const appName = "updateDeploymentWithShortVersion";
    return account
      .createToken({
        profile: { email, name: "short" },
        provider: "GitHub"
      })
      .then(() => ac.createApp({ email, name: appName }))
      .then(_ => createZip(`v1 short package`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "v1 description",
            appVersion: "19.18"
          }
        })
      )
      .then(() =>
        ac.updateDeployment({
          app: appName,
          email,
          description: "v1 updated description",
          deployment: "Staging",
          appVersion: "19.18"
        })
      )
      .then(updated => {
        expect(updated).not.undefined;
        expect(updated.description).eq("v1 updated description");
        expect(updated.appVersion).eq("19.18");
      });
  });

  it("updateDeployment should not copy from latest", () => {
    const email = "joesmoe@walmart.com";
    const appName = "updateDeployementDoesNotCopy";

    return account
      .createToken({
        profile: { email, name: "joe" },
        provider: "GitHub"
      })
      .then(() => ac.createApp({ email, name: appName }))
      .then(() => createZip(`package copy latest`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "v1 description to be modified",
            label: "v1",
            rollout: 1,
            isDisabled: true,
            isMandatory: true,
            appVersion: "1.0.0",
            tags: ["blue"]
          }
        })
      )
      .then(() => createZip(`package copy latest 2`))
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            description: "v2 description",
            label: "v2",
            rollout: 99,
            isDisabled: false,
            isMandatory: false,
            appVersion: "2.0.0",
            tags: ["red"]
          }
        })
      )
      .then(() =>
        ac.updateDeployment({
          app: appName,
          email,
          deployment: "Staging",
          label: "v1",
          description: "v1 new description"
        })
      )
      .then(updated => {
        expect(updated.label).to.eq("v1");
        expect(updated.description).to.eq("v1 new description");
        expect(updated.rollout).to.eq(1);
        expect(updated.isDisabled).to.be.true;
        expect(updated.isMandatory).to.be.true;
        expect(updated.appVersion).to.eq("1.0.0");
        expect(updated.tags).to.have.members(["blue"]);
      })
      .then(() =>
        ac.historyDeployment({
          app: appName,
          email,
          deployment: "Staging"
        })
      )
      .then(history => {
        expect(history.length).to.eq(2);
        const v1 = history[1];
        expect(v1.label).to.eq("v1");
        expect(v1.description).to.eq("v1 new description");
        expect(v1.rollout).to.eq(1);
        expect(v1.isDisabled).to.be.true;
        expect(v1.isMandatory).to.be.true;
        expect(v1.appVersion).to.eq("1.0.0");
        expect(v1.tags).to.have.members(["blue"]);
      });
  });

  it("retrieve metrics", () => {
    const appName = "metricsApp";
    const email = "metricsApp@walmart.com";
    const deployment = "Staging";
    let deploymentKey;
    return account
      .createToken({
        profile: { email, name: "metrics" },
        provider: "GitHub"
      })
      .then(() => ac.createApp({ email, name: appName }))
      .then(app => dao.deploymentByApp(app.id, "Staging"))
      .then(deployment => {
        deploymentKey = deployment.key;
      })
      .then(() => {
        const data = [
          { label: "v1", appversion: "1.0.0", status: "Downloaded" },
          { label: "v1", appversion: "1.0.0", status: "DeploymentSucceeded" },
          { label: "v1", appversion: "1.0.0", status: "DeploymentSucceeded" },
          { label: "v1", appversion: "1.0.0", status: "Downloaded" },
          { label: "v1", appversion: "1.0.0", status: "DeploymentFailed" }
        ];
        return Promise.all(
          data.map(d =>
            dao.insertMetric({
              clientUniqueId: "ABC",
              deploymentKey,
              status: d.status,
              label: d.label,
              appVersion: d.appversion
            })
          )
        );
      })
      .then(() =>
        ac.metrics({
          email,
          app: appName,
          deployment
        })
      )
      .then(metrics => {
        expect(metrics["v1"].active).to.eq(2);
        expect(metrics["v1"].downloaded).to.eq(2);
        expect(metrics["v1"].installed).to.eq(2);
        expect(metrics["v1"].failed).to.eq(1);
      });
  });

  it("metrics should not have negative active count", () => {
    const appName = "negativeMetrics";
    const email = "negativeMetrics@walmart.com";
    const deployment = "Staging";
    let deploymentKey;
    return createAccount(email, "negative")
      .then(() => ac.createApp({ email, name: appName }))
      .then(app => dao.deploymentByApp(app.id, deployment))
      .then(deployment => {
        deploymentKey = deployment.key;
        return createZip(`negative package`);
      })
      .then(pkg =>
        ac.upload({
          app: appName,
          email,
          package: pkg,
          deployment: "Staging",
          packageInfo: {
            label: "v1"
          }
        })
      )
      .then(() => {
        const data = [
          {
            status: "DeploymentSucceeded",
            label: "1.0.0",
            appversion: "1.0.0",
            previouslabelorappversion: "0.0.0"
          },
          {
            status: "DeploymentSucceeded",
            label: "v1",
            appversion: "1.0.0",
            previouslabelorappversion: "1.0.0"
          },
          {
            status: "DeploymentSucceeded",
            label: "v1",
            appversion: "1.0.0",
            previouslabelorappversion: "1.0.0"
          },
          {
            status: "DeploymentSucceeded",
            label: "v1",
            appversion: "1.0.0",
            previouslabelorappversion: "1.0.0"
          }
        ];
        return Promise.all(
          data.map(d =>
            dao.insertMetric({
              clientUniqueId: "DEF",
              deploymentKey,
              status: d.status,
              label: d.label,
              appVersion: d.appversion,
              previousLabelOrAppVersion: d.previouslabelorappversion
            })
          )
        );
      })
      .then(() =>
        ac.metrics({
          email,
          app: appName,
          deployment
        })
      )
      .then(metrics => {
        expect(metrics["v1"].active).to.eq(3);
        // active should not go negative
        expect(metrics["1.0.0"].active).to.eq(0);
        expect(metrics["1.0.0"].downloaded).to.eq(0);
        expect(metrics["1.0.0"].installed).to.eq(1);
        expect(metrics["1.0.0"].failed).to.eq(0);
      });
  });

  it("retrieve metric from summary if available in summary", async () => {
    const { appName, email, deploymentType } = metricSummaryApp;

    await createAccount(email, "cached_summary");
    const app = await ac.createApp({ email, name: appName });
    metricSummaryDeployment = await dao.deploymentByApp(app.id, deploymentType);
    const pkg = await createZip(`package summarized`);
    await ac.upload({
      app: appName,
      email,
      package: pkg,
      deployment: deploymentType,
      packageInfo: { label: "v1" }
    });
    await dao.insertMetric({
      clientUniqueId: "UDD",
      deploymentKey: metricSummaryDeployment.key,
      status: "DeploymentSucceeded",
      label: "1.0.0",
      appVersion: "1.0.0",
      previousLabelOrAppVersion: "0.9.0"
    });
    await dao.addOrUpdateMetricSummary({
      deploymentId: metricSummaryDeployment.id,
      lastRunTimeUTC: new Date(Date.now() - ONE_MIN * ONE_SECOND),
      summaryJson: JSON.stringify({"1.0.0": { active: 2, downloaded: 2, installed: 1, failed: 1 }})
    });

    const metrics = await ac.metrics({ email, app: appName, deployment: deploymentType });
    expect(metrics["1.0.0"]).to.be.an("object");
  });

  it("retrieve metric from summary + real-time metrics", async () => {
    const { appName, email, deploymentType } = metricSummaryApp;

    await dao.insertMetric({
      clientUniqueId: "UDD",
      deploymentKey: metricSummaryDeployment.key,
      status: "DeploymentSucceeded",
      label: "1.1.0",
      appVersion: "1.0.0",
      previousLabelOrAppVersion: "1.0.0"
    });
    await dao.insertMetric({
      clientUniqueId: "UDD",
      deploymentKey: metricSummaryDeployment.key,
      status: "DeploymentSucceeded",
      label: "1.1.0",
      appVersion: "1.0.0",
      previousLabelOrAppVersion: "1.0.0"
    });
    await dao.insertMetric({
      clientUniqueId: "UDD",
      deploymentKey: metricSummaryDeployment.key,
      status: "DeploymentSucceeded",
      label: "1.1.0",
      appVersion: "1.0.0",
      previousLabelOrAppVersion: "1.0.0"
    });

    const metrics = await ac.metrics({ email, app: appName, deployment: deploymentType });
    expect(metrics["1.0.0"]).to.be.an("object");
    expect(metrics["1.1.0"]).to.be.an("object");
  });
});
