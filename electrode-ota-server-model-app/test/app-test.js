import initDao, {
  shutdown
} from "electrode-ota-server-test-support/lib/init-dao";
import eql from "electrode-ota-server-test-support/lib/eql";
import path from "path";
import fs from "fs";
import appFactory from "electrode-ota-server-model-app/lib/app";
import accountFactory from "electrode-ota-server-model-account/lib/account";
import { fileservice as upload } from "electrode-ota-server-fileservice-upload";
import { fileservice as download } from "electrode-ota-server-fileservice-download";
import { manifestHash } from "electrode-ota-server-model-manifest/lib/manifest";
import { shasum } from "electrode-ota-server-util";
import { expect } from "chai";
import step0Manifest from "./fixtures/step.0.manifest.json";

const fixture = path.join.bind(path, __dirname, "fixtures");
const readFixture = file => fs.readFileSync(fixture(file));

const shouldError = () => {
  expect(false, "Should have an error").to.be.true;
};
const APP = {
  email: "test@p.com",
  app: "super"
};

describe("model/app", function() {
  this.timeout(50000);
  let account, ac;
  before(async () => {
    const dao = await initDao();
    let w = 0;
    account = accountFactory({}, dao, console);
    const up = upload({}, dao),
      down = download({}, dao);
    ac = appFactory(
      {},
      dao,
      up,
      history => diffPackageMap(down, up, history),
      console
    );
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
    const email = "deployment@p.com",
      app = "deployment";
    return ac
      .createApp({ email, name: "deployment" })
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
      .then(_ =>
        ac.renameDeployment({ email, app, deployment: "what", name: "sowhat" })
      )
      .then(_ => ac.listDeployments({ email, app }))
      .then(deps => {
        expect(deps.length).to.eql(2);
      });
  });
  it("should upload and promote", () => {
    const email = "test@p.com";

    return ac
      .createApp({ email, name: "superd" })
      .then(_ => {
        return ac.upload({
          app: "superd",
          email,
          package: `This is a string`,
          packageInfo: {
            isDisabled: true,
            rollout: 25,
            isMandatory: true,
            description: "Super Cool"
          }
        });
      })
      .then(_ => {
        return ac.upload({
          app: "superd",
          email,
          package: `This is another string`,
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
        v.forEach(v => expect(delete v.uploadTime).to.be.true);
        return v;
      })
      .then(
        eql([
          {
            appVersion: "1.0.2",
            blobUrl:
              "8d7573816249dc6f9f34bd04dc07d4bb62c5deb6c3b1b5e574e0f26c0d2f25c9",
            description: "Not Super Cool",
            diffPackageMap: null,
            isDisabled: false,
            isMandatory: true,
            label: "v2",
            originalDeployment: null,
            originalLabel: null,
            manifestBlobUrl: null,
            packageHash:
              "8d7573816249dc6f9f34bd04dc07d4bb62c5deb6c3b1b5e574e0f26c0d2f25c9",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 50,
            size: "22"
          },
          {
            appVersion: "1.0.0",
            blobUrl:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            description: "Super Cool",
            diffPackageMap: null,
            isDisabled: true,
            isMandatory: true,
            label: "v1",
            manifestBlobUrl: null,
            originalDeployment: null,
            originalLabel: null,
            packageHash:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 25,
            size: "16"
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
      .then(_ =>
        ac.historyDeployment({ app: "superd", email, deployment: "Production" })
      )
      .then(v => {
        expect(v.length, "should be 1").to.eql(1);
        v.forEach(v => delete v.uploadTime);
        return v[0];
      })
      .then(
        eql({
          appVersion: "1.0.2",
          blobUrl:
            "8d7573816249dc6f9f34bd04dc07d4bb62c5deb6c3b1b5e574e0f26c0d2f25c9",
          description: "Not Super Cool",
          diffPackageMap: null,
          isDisabled: false,
          isMandatory: true,
          label: "v1",
          manifestBlobUrl: null,
          originalDeployment: "Staging",
          originalLabel: "v2",
          releaseMethod: "Promote",
          releasedBy: "test@p.com",
          rollout: null,
          size: "22",
          packageHash:
            "8d7573816249dc6f9f34bd04dc07d4bb62c5deb6c3b1b5e574e0f26c0d2f25c9"
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
        return dep;
      })
      .then(
        eql({
          appVersion: "1.2.3",
          blobUrl:
            "8d7573816249dc6f9f34bd04dc07d4bb62c5deb6c3b1b5e574e0f26c0d2f25c9",
          description: "Not Super Cool",
          diffPackageMap: null,
          isDisabled: true,
          isMandatory: true,
          manifestBlobUrl: null,
          label: "v1",
          originalDeployment: "Staging",
          originalLabel: "v2",
          packageHash:
            "8d7573816249dc6f9f34bd04dc07d4bb62c5deb6c3b1b5e574e0f26c0d2f25c9",
          releaseMethod: "Promote",
          releasedBy: "test@p.com",
          rollout: 50,
          size: "22"
        })
      );
  });
  it("should rollback to last", () => {
    const email = "test@p.com";
    return ac
      .createApp({ email, name: "rollback" })
      .then(_ =>
        ac.upload({
          app: "rollback",
          email,
          package: `This is a string`,
          packageInfo: {
            isDisabled: true,
            rollout: 25,
            isMandatory: true,
            description: "Super Cool"
          }
        })
      )
      .then(_ =>
        ac.upload({
          app: "rollback",
          email,
          package: `This is a different string`,
          packageInfo: {
            appVersion: "1.0.2",
            rollout: 50,
            isMandatory: true,
            description: "Not Super Cool"
          }
        })
      )
      .then(_ => ac.rollback({ email, app: "rollback", deployment: "Staging" }))
      .then(_ =>
        ac.historyDeployment({ email, app: "rollback", deployment: "Staging" })
      )
      .then(history => {
        expect(history, "history length")
          .to.be.an("array")
          .with.length(3);
        history.forEach(
          v => expect(delete v.uploadTime, "should have uploadTime").to.be.true
        );
        return history;
      })
      .then(
        eql([
          {
            appVersion: "1.0.0",
            description: "Super Cool",
            diffPackageMap: null,
            isDisabled: true,
            isMandatory: true,
            label: "v3",
            originalDeployment: null,
            manifestBlobUrl: null,
            originalLabel: "v1",
            packageHash:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            blobUrl:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",

            releaseMethod: "Rollback",
            releasedBy: "test@p.com",
            rollout: 100,
            size: "16"
          },
          {
            appVersion: "1.0.2",
            description: "Not Super Cool",
            diffPackageMap: null,
            isDisabled: false,
            isMandatory: true,
            manifestBlobUrl: null,
            label: "v2",
            originalDeployment: null,
            originalLabel: null,
            packageHash:
              "f879d06a6923af0723ee0ac3ffbf8e81d2ef8596a7b8cb0160452e1cea74474a",
            blobUrl:
              "f879d06a6923af0723ee0ac3ffbf8e81d2ef8596a7b8cb0160452e1cea74474a",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 50,
            size: "26"
          },
          {
            appVersion: "1.0.0",
            description: "Super Cool",
            diffPackageMap: null,
            isDisabled: true,
            manifestBlobUrl: null,
            isMandatory: true,
            label: "v1",
            originalDeployment: null,
            originalLabel: null,
            blobUrl:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            packageHash:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 25,
            size: "16"
          }
        ])
      );
  });
  it("should rollback to label", () => {
    const email = "test@p.com";
    return ac
      .createApp({ email, name: "rollbackToLabel" })
      .then(_ =>
        ac.upload({
          app: "rollbackToLabel",
          email,
          package: `This is a string`,
          packageInfo: {
            isDisabled: true,
            rollout: 25,
            isMandatory: true,
            description: "Super Cool"
          }
        })
      )
      .then(_ =>
        ac.upload({
          app: "rollbackToLabel",
          email,
          package: `This is a different string`,
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
        history.forEach(
          v => expect(delete v.uploadTime, "should have uploadTime").to.be.true
        );
        return history;
      })
      .then(
        eql([
          {
            appVersion: "1.0.0",
            blobUrl:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            description: "Super Cool",
            diffPackageMap: null,
            isDisabled: true,
            manifestBlobUrl: null,

            isMandatory: true,
            label: "v3",
            originalDeployment: null,
            originalLabel: "v1",
            packageHash:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            releaseMethod: "Rollback",
            releasedBy: "test@p.com",
            rollout: 100,
            size: "16"
          },
          {
            appVersion: "1.0.2",
            blobUrl:
              "f879d06a6923af0723ee0ac3ffbf8e81d2ef8596a7b8cb0160452e1cea74474a",
            description: "Not Super Cool",
            diffPackageMap: null,
            isDisabled: false,
            isMandatory: true,
            manifestBlobUrl: null,
            label: "v2",
            originalDeployment: null,
            originalLabel: null,
            packageHash:
              "f879d06a6923af0723ee0ac3ffbf8e81d2ef8596a7b8cb0160452e1cea74474a",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 50,
            size: "26"
          },
          {
            appVersion: "1.0.0",
            blobUrl:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            description: "Super Cool",
            diffPackageMap: null,
            isDisabled: true,
            isMandatory: true,
            manifestBlobUrl: null,
            label: "v1",
            originalDeployment: null,
            originalLabel: null,
            packageHash:
              "4e9518575422c9087396887ce20477ab5f550a4aa3d161c5c22a996b0abb8b35",
            releaseMethod: "Upload",
            releasedBy: "test@p.com",
            rollout: 25,
            size: "16"
          }
        ])
      );
  });
  //const TOKEN = {profile: {email: 'test@t.com', name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}};

  it("should add/remove/transfer collabordators", () =>
    ac
      .createApp({
        email: "what@p.com",
        name: "addcollab"
      })

      .then(_ =>
        ac
          .addCollaborator({
            email: "what@p.com",
            app: "addcollab",
            collaborator: "stuff@p.com"
          })
          .then(shouldError, e => {
            expect(e.message).to.eql(
              `The specified e-mail address doesn't represent a registered user`
            );
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
            expect(e.message).to.eql(
              "Cannot remove the owner of the app from collaborator list."
            );
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
            expect(e.message).to.eql(
              `The specified e-mail address doesn't represent a registered user`
            );
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
    return ac
      .createApp({ email, name: appName })
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
    return ac
      .createApp({ email, name: appName })
      .then(() =>
        ac.upload({
          app: appName,
          email,
          package: readFixture("step.0.blob.zip"),
          deployment: "Staging",
          packageInfo: {
            description: "First upload succeeds"
          }
        })
      )
      .then(() => {
        let hasException = false;
        return ac
          .upload({
            app: appName,
            email,
            deployment: "Staging",
            package: readFixture("step.0.blob.zip"),
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
});
