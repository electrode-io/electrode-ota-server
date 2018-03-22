import initDao, { shutdown } from 'electrode-ota-server-test-support/lib/init-dao';
import acquisition from 'electrode-ota-server-model-acquisition/lib/acquisition';
import { loggerFactory } from 'electrode-ota-server-logger';
import { fileservice as uploadFactory } from 'electrode-ota-server-fileservice-upload';
import { fileservice as downloadFactory } from 'electrode-ota-server-fileservice-download';
import { diffPackageMapCurrent } from 'electrode-ota-server-model-manifest/lib/manifest';
import appFactory from 'electrode-ota-server-model-app/lib/app';
import { expect } from 'chai';
import fs from 'fs';

describe('model/acquisition', function () {
    let ac;
    let appBL;
    let dao;
    this.timeout(50000);
    let i = 0;
    const genRatio = (ratio) => {
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

    describe("isUpdateAble", () => {
        it('should be 50% rollout', () => {
            const result = [];
            const update = (uniqueClientId = 'uniqueClientId',
                packageHash = 'packageHash',
                ratio = 50) => () => ac.isUpdateAble(uniqueClientId, packageHash, ratio).then(r => result.push(r));
            const first = update();
            return first().then(first).then(first).then(_ => {
                const [r0, r1, r2] = result;
                expect(r0).to.be.true;
                expect(r1).to.be.true;
                expect(r2).to.be.true;
                result.length = 0;
            }).then(update('id1', 'hash', 3))
                .then(update('id1', 'hash', 3))
                .then(update('id1', 'hash', 99))
                .then(_ => {
                    const [r0, r1, r2] = result;
                    expect(r0).to.be.false;
                    expect(r1).to.be.false;
                    expect(r2).to.be.false;
                });
        });

        it("will return true if tags are involved", () => {
            return ac.isUpdateAble("clientid", "190f09j9032", 0, ["TAG-1"]).then((result) => {
                expect(result).to.eq(true);
            });
        });
    });


    describe("updateCheck", () => {
        const email = 'test@unit-test.com';
        const name = 'TestApp';
        let stagingKey = '';
        let productionKey = '';
        let clientUniqueId = '190jf09j2f01j10901';

        before(() => {
            return appBL.createApp({ email, name }).then((a) => {
                return dao.deploymentByApp(a.id, 'Staging').then((deployment) => {
                    stagingKey = deployment.key;
                });
            });
        });

        it('will return package available for rollout 100 and no tags', () => {
            return appBL.upload({
                app: name,
                email,
                package: 'stuff-stuff-stuff-stuff-stuff',
                deployment: 'Staging',
                packageInfo: {
                    description: 'release without tags initially',
                    rollout: 100
                }
            }).then(() => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: '1.0.0',
                    packageHash: 'junk',
                    isCompanion: false,
                    label: 'v0',
                    clientUniqueId
                }).then((result) => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(true);
                });
            });
        });

        it('will return package not available for rollout 0 and no tags', () => {
            return appBL.upload({
                app: name,
                email,
                package: 'more-stuff-stuff-stuff-stuff',
                deployment: 'Staging',
                packageInfo: {
                    description: 'another release without tags',
                    rollout: 0
                }
            }).then(() => {
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: '1.0.0',
                    packageHash: 'junk',
                    isCompanion: false,
                    label: 'v0',
                    clientUniqueId
                }).then((result) => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(false);
                });
            });
        });

        it('will return package available if there are matching tags', () => {
            return appBL.upload({
                app: name,
                email,
                package: 'even-more-stuff-stuff-stuff-stuff-stuff',
                deployment: 'Staging',
                packageInfo: {
                    description: 'Got some tags',
                    tags: ['TAG-1', 'TAG-2']
                }
            }).then((pkg) => {
                expect(pkg).not.to.be.undefined;
                expect(pkg.packageHash).not.to.be.undefined;

                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: '1.0.0',
                    packageHash: 'junk',
                    isCompanion: false,
                    label: 'v0',
                    clientUniqueId,
                    tags: ['TAG-1']
                }).then((result) => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(true);
                    expect(result.packageHash).to.eq(pkg.packageHash);
                });
            });
        });

        it('will return package not available if there are no matching tags', () => {
            // depends on the previous tests
            return ac.updateCheck({
                deploymentKey: stagingKey,
                appVersion: '1.0.0',
                packageHash: 'junk',
                isCompanion: false,
                label: 'v0',
                clientUniqueId,
                tags: ['SOME-OTHER-TAG', 'YET-ANOTHER-TAG']
            }).then((result) => {
                expect(result).not.to.be.undefined;
                expect(result.isAvailable).to.eq(false);
            });
        });

        it('will return package not available if packageHash is unknown', () => {
            return appBL.upload({
                app: name,
                email,
                package: fs.readFileSync(__dirname + "/fixture/package.0.zip"),
                deployment: 'Staging',
                packageInfo: {
                    description: 'Some zipped package',
                }
            }).then((pkg) => {
                expect(pkg).not.to.be.undefined;
                expect(pkg.packageHash).not.to.be.undefined;
                return ac.updateCheck({
                    deploymentKey: stagingKey,
                    appVersion: '1.0.0',
                    packageHash: 'packageThatDoesNotExist',
                    clientUniqueId
                }).then((result) => {
                    expect(result).not.to.be.undefined;
                    expect(result.isAvailable).to.eq(false);
                });
            });
        });
    });
});
