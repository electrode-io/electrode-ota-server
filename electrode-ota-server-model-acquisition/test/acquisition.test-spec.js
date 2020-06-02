import { expect } from "chai";
import appFactory from "electrode-ota-server-model-app/lib/app";
import accountFactory from "electrode-ota-server-model-account/lib/account";
import acquisitionFactory from "electrode-ota-server-model-acquisition/lib/acquisition";
import { fileservice as uploadFactory } from "electrode-ota-server-fileservice-upload";
import { fileservice as downloadFactory } from "electrode-ota-server-fileservice-download";
import { diffPackageMapCurrent } from "electrode-ota-server-model-manifest/lib/manifest";
import initDao, { shutdown } from "electrode-ota-server-test-support/lib/init-maria-dao";
import createZip from "electrode-ota-server-test-support/lib/create-zip";

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
const APP = {
  email: "acq-test@unit-test.com",
  name: "TestApp"
};
const noop = () => {};
const noLogger = {
  info: noop
};

describe("model/acquisition", function () {
    this.timeout(50000);
    let account;
    let acquisition;
    let appBL;
    let dao;
    let i = 0;
    const genRatio = ratio => {
        const ret = ratio % (i += 25) === 0;
        return ret;
    };
    const createAccount = (email, name = "cselva") => {
      return account.createToken({
        profile: { email, name },
        provider: "GitHub"
      });
    };
    before(async () => {
        dao = await initDao(testDBConfig);
        //options, dao, weighted, _download, manifest, logger
        const upload = uploadFactory({}, dao);
        const download = downloadFactory({}, dao);
        const logger = noLogger;// loggerFactory({});
        const manifest = diffPackageMapCurrent.bind(null, download, upload);
        acquisition = acquisitionFactory({}, dao, genRatio, download, manifest, logger);
        appBL = appFactory({}, dao, upload, logger);

        account = accountFactory({}, dao, logger);
        await createAccount(APP.email);
    });
    after(shutdown);

    describe("Package delta, duplicate entry scenario", () => {
        const { email, name } = APP;
        const clientA = "190jf09j2f01j10901";
        const clientB = "DEF222";
        let stagingKey;
        let pkg1;
        let pkg2;

        const releaseApp = async (content, description) => {
          const pack = await createZip(content);
          return await appBL.upload({
            email,
            app: name,
            package: pack,
            deployment: "Staging",
            packageInfo: {
              description,
              appVersion: "1.0.0"
            }
          });
        };

        const doUpdateCheck = async (clientUniqueId, packageHash = "", label = "v0") => {
          return await acquisition.updateCheck({
            clientUniqueId,
            label,
            packageHash,
            deploymentKey: stagingKey,
            appVersion: "1.0.0",
            isCompanion: false
          });
        };

        before(() => {
          return appBL.createApp({ email, name }).then(a => {
              return dao.deploymentByApp(a.id, "Staging").then(deployment => {
                  stagingKey = deployment.key;
              });
          });
        });

        it("clients A & B receive First Bundle", async () => {
          pkg1 = await releaseApp(`Content bundle 1`, "first package");

          let result = await doUpdateCheck(clientA);
          expect(result.isAvailable).eq(true);
          expect(result.description).eq("first package");

          result = await doUpdateCheck(clientB);
          expect(result.isAvailable).eq(true);
          expect(result.description).eq("first package");
        });

        it("client A receives Second Bundle", async () => {
          pkg2 = await releaseApp(`Content bundle 2`, "second package");

          const result = await doUpdateCheck(clientA, pkg1.packageHash, pkg1.label);
          expect(result.isAvailable).eq(true);
          expect(result.description).eq("second package");
        });

        it("client A receives Third Bundle", async () => {
          // eslint-disable-next-line no-unused-vars
          const pkg3 = await releaseApp(`Content bundle 3`, "third package");

          const result = await doUpdateCheck(clientA, pkg2.packageHash, pkg2.label);
          expect(result.isAvailable).eq(true);
          expect(result.description).eq("third package");
        });

        it("client B on First Bundle, should receive Third Bundle", async () => {
          const result = await doUpdateCheck(clientB, pkg1.packageHash, pkg2.label);
          expect(result.isAvailable).eq(true);
          expect(result.description).eq("third package");
        });
    });
});
