const manifest = require('../server/model/manifest');
const expect = require('chai').expect;
const path = require('path');
const join = path.join.bind(path, __dirname);
const fixture = path.join.bind(path, __dirname, 'fixtures');
const step0 = require('./fixtures/step.0.manifest.json');
const step1 = require('./fixtures/step.1.manifest.json');
const step2 = require('./fixtures/step.2.manifest.json');
const history = require('./fixtures/history.json').history;
const fs = require('fs');
const {shasum} = require('../server/util');
const eql = eql => resp => {
    expect(resp).to.eql(eql);
    return resp;
};
const debug = (resp)=> {
    console.log(JSON.stringify(resp, null, 2));
    return resp;
};

const readFile = (file, options = {}) => {
    return new Promise((resolve, reject)=> {
        fs.readFile(file, options, function (err, buffer) {
            if (err) return reject(err);
            resolve(buffer);
        });
    })
};
const readFixture = (file, options)=> readFile(fixture(file), options);

const readJSON = (file)=> {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

describe('manifest', function () {
    this.timeout(50000);
    it('should generate manifest step0', ()=> readFixture('step.0.blob.zip').then(manifest.generate).then(eql(step0)));
    it('should generate manifest step1', ()=> Promise.resolve(fixture('step.1.blob.zip')).then(manifest.generate).then(eql(step1)));
    it('should generate manifest step2', ()=> readFixture('step.2.blob.zip').then(manifest.generate).then(eql(step2)));

    it('should generate a delta file from a file and a manifest', function () {

        return readFixture('step.2.blob.zip')
            .then(buffer=>manifest.delta(step1, buffer))
            .then(manifest.zipToBuf)
            .then(manifest.generate)
            .then(eql)
            .then(check=> manifest.generate(fixture('step.2.map.c7b8f2545224a4d180f8deeebf3fbdc267600ffe1f76914236cd186be45c6229.zip'))
                .then(check));

    });

    it('should generate diffPackageMap', function () {
        const blobs = {}, hashes = {}, manifests = {};
        const test = history.map((obj, i)=> {
            const ret = Object.assign({}, obj);
            delete ret.diffPackageMap;
            if (i % 2 == 0){
                delete ret.manifestBlobUrl;
            }
            return ret;
        });
        history.map(function (history, idx) {
            blobs[history.blobUrl] = join('fixtures', `step.${idx}.blob.zip`);
            hashes[history.packageHash] = join('fixtures', `step.${idx}.blob.zip`);
            manifests[history.manifestBlobUrl] = join('fixtures', `step.${idx}.manifest.json`);
        });
        const download = (packageHash, url)=> {
            if (packageHash) {
                return Promise.resolve(hashes[packageHash]);
            }
            if (blobs[url]) {
                return Promise.resolve(blobs[packageHash]);
            }
            if (manifests[url]) {
                return Promise.resolve(readJSON(manifests[url]));
            }
        };
        const upload = (blob)=> {
            const blobUrl = shasum(blob);
            return Promise.resolve({
                size: blob.length,
                blobUrl
            });

        };

        return manifest.diffPackageMap(download, upload, test).then(eql([
            {
                "description": "",
                "isDisabled": false,
                "isMandatory": false,
                "rollout": null,
                "appVersion": "1.2.3",
                "packageHash": "88e410afa6c963ceb2274ea1e916475d46d3d6be9e59ecde33cb9292049ff887",
                "blobUrl": "https://codepush.blob.core.windows.net/storagev2/HDUhd4fIF9uB5i1WZXmvUEX7g8WmEy9mceh0-",
                "size": 206162,
                "releaseMethod": "Upload",
                "uploadTime": 1477428204802,
                "label": "v1",
                "releasedBy": "speajus4@gmail.com",
                "manifestBlobUrl": "4f5eb4a5963006482dd1e394c9aa1685f090dd02412c496cbf2ac201813ef51e"
            },
            {
                "description": "",
                "isDisabled": false,
                "isMandatory": false,
                "rollout": null,
                "appVersion": "1.2.3",
                "packageHash": "c7b8f2545224a4d180f8deeebf3fbdc267600ffe1f76914236cd186be45c6229",
                "blobUrl": "https://codepush.blob.core.windows.net/storagev2/Kork8FKe8JPGehC5n8Rnu-kOJNhrEy9mceh0-",
                "size": 206171,
                "manifestBlobUrl": "https://codepush.blob.core.windows.net/storagev2/c1JpjgtxVsQsryN3BKs0w5S6bzGvEy9mceh0-",
                "releaseMethod": "Upload",
                "uploadTime": 1477428538098,
                "label": "v2",
                "releasedBy": "speajus4@gmail.com",
                "diffPackageMap": {
                    "88e410afa6c963ceb2274ea1e916475d46d3d6be9e59ecde33cb9292049ff887": {
                        "url": "13c309b26574d7579b1cbbf6ae192eaaba397d576be38d780a2dbd8a42fe736a",
                        "size": 193461
                    }
                }
            },
            {
                "description": "",
                "isDisabled": false,
                "isMandatory": false,
                "rollout": 100,
                "appVersion": "1.2.3",
                "packageHash": "21d0bbc45627831a12a9739fa03813504aff79e5f5a876eb4e603fc641c62e21",
                "blobUrl": "https://codepush.blob.core.windows.net/storagev2/aXKJRSWyPAh_yDPTvSL3LJ8PLUk3Ey9mceh0-",
                "size": 206157,
                "releaseMethod": "Upload",
                "uploadTime": 1477433572067,
                "label": "v3",
                "releasedBy": "speajus4@gmail.com",
                "manifestBlobUrl": "7b9b1a354c45130f067040cdfeea13fb18417a3f72e01896b59972032d5e7bf3",
                "diffPackageMap": {
                    "88e410afa6c963ceb2274ea1e916475d46d3d6be9e59ecde33cb9292049ff887": {
                        "url": "f92e41ebbf0a021b56c9ec4a02ba16a5542b20cc79466c0b0b8c2470acab5c20",
                        "size": 202928
                    },
                    "c7b8f2545224a4d180f8deeebf3fbdc267600ffe1f76914236cd186be45c6229": {
                        "url": "356b61c7ad35d4bc5a3f10ab444036a944c4a93c31405d30dd64a1f7a758954e",
                        "size": 202937
                    }
                }
            }
        ]));
    });
});
