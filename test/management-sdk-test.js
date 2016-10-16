const {env} = process;
//EVIL - But we need snoopage
env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const AccountManager = require('code-push/script/management-sdk');
const {expect} = require('chai');
const {AcquisitionManager, AcquisitionStatus} = require('code-push/script/acquisition-sdk');
const server = process.env.MS_CONFIG ? require('./support/server-ms') : require('./support/server-init');

const verbs = 'GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS, CONNECT, PATCH'.toLowerCase().split(/,\s*/);
const uploadFile = "./test/fixtures/upload.zip";
const uploadFile2 = "./test/fixtures/upload2.zip";
const uploadFile3 = "./test/fixtures/upload3.zip";

const clientUniqueId = '6451410-77F2-423C-836C-623AA5F586B5';
const clientUniqueId2 = '2451410-77F2-423C-836C-623AA5F586B5';

const expected = (eql = null)=>(result)=>expect(result).to.eql(eql);
const contains = (eql = null)=>(result)=> {
    expect(result).to.contains(eql);
    return result
};
const P = (r, e)=>new Promise(r, e);
const hasKeys = (...keys)=>(obj)=> {
    for (const key of keys) {
        expect(key in obj).to.be.true;
    }
};
describe('managment-sdk', function () {
    this.timeout(50000);

    let am;
    let agent;
    let updateServerUrl;
    let collaborator;
    let extraCollaborator;
    let aquistionServerUrl;
    let stop;
    const proxy = env.CP_HTTP_PROXY || 'http://localhost:8888';

    before(()=>server().then((setup)=> {
        updateServerUrl = setup.serverUrl;
        aquistionServerUrl = setup.aquistionServerUrl || '';
        accessKey = setup.accessKey;
        collaborator = setup.collaborator;
        extraCollaborator = setup.extraCollaborator;
        agent = setup.agent;
        am = new AccountManager(setup.accessKey, {}, setup.serverUrl, setup.proxy);
        stop = setup.stop;
    }));
    after(()=> {
        return stop && stop();
    });

    const aq = (req)=> {
        const configuration = Object.assign({
            serverUrl: aquistionServerUrl,
            headers: {
                'content-type': 'application/json'
            }
        }, req);
        return new AcquisitionManager({
            request(type, url, body, cb){
                if (!cb) cb = body;
                agent[verbs[type]](url).set(configuration.headers).send(body).end(function (err, response) {
                    if (response && typeof response.body === 'object') {
                        response.body = JSON.stringify(response.body);
                    }
                    cb(err, response);
                });

            }
        }, configuration);
    };
    describe('isAuthenticated', ()=> {
        it('should reply', ()=> {
            return am.isAuthenticated().then(expected(true))
        });
    });

    describe('access-key', ()=> {
        let akey;

        beforeEach(()=> {
            akey = `access-key-${Date.now()}`;
        });


        it('should add key', ()=> am.addAccessKey(akey, 3000)
            .then(({name})=>expect(name).to.eql(akey))
            .then(_=>am.removeAccessKey(akey)));

        it('should patch key', ()=> {
            const nkey = `new-key-${Date.now()}`;
            return am.addAccessKey(akey).then(_=>am.patchAccessKey(akey, nkey)).then(({name})=> {
                expect(name).to.eql(nkey)
                akey = nkey;
            });
        });

        it('should remove key', ()=> am.addAccessKey(akey).then(_=>am.removeAccessKey(akey)).then(expected()));

        it('should list key', ()=> am.addAccessKey(akey)
            .then(_=>am.getAccessKeys())
            .then((r)=> {
                //noinspection BadExpressionStatementJS
                expect(r.length > 1).to.be.true;
                //noinspection BadExpressionStatementJS
                expect(r.find(f=>f.name === akey)).to.exist;
            }));
    });

    describe('app', ()=> {

        let name;
        beforeEach(function () {
            name = `${this.currentTest.title.replace(/\s+?/g, '_')}-${Date.now()}`;
        });

        it('should add app', ()=> am.addApp(name).then(expected({name})));

        it('should remove app', ()=> am.addApp(name).then(_=>am.removeApp(name)).then(expected()));

        it('should list app', ()=> am.addApp(name).then(_=>am.getApps())
            .then(apps=>apps.find(v=>v.name == name))
            .then(expected({
                "collaborators": {
                    [collaborator]: {
                        "isCurrentAccount": true,
                        "permission": "Owner"
                    }
                },
                "deployments": [
                    "Production",
                    "Staging"
                ],
                name
            })));

        it('should rename app', ()=>am.addApp(name).then(_=>am.renameApp(name, `rename-to-${Date.now()}`)).then(expected()));

        it('should transfer app', ()=>am.addApp(name).then(_=>am.transferApp(name, extraCollaborator)).then(_=>am.getApp(name))
            .then(expected({
                name,
                "collaborators": {
                    [collaborator]: {
                        "permission": "Collaborator",
                        "isCurrentAccount": true
                    },
                    [extraCollaborator]: {
                        "permission": "Owner"
                    }
                },
                "deployments": ["Production", "Staging"]
            })));
    });
    describe('collaborator', ()=> {
        let name;
        beforeEach(function () {
            name = `${this.currentTest.title.replace(/\s+?/, '_')}-${Date.now()}`;
        });

        it('should add collaborator', ()=> am.addApp(name)
            .then(_=>am.addCollaborator(name, extraCollaborator))
            .then(_=>am.getApp(name))
            .then(expected({
                name,
                "collaborators": {
                    [collaborator]: {"permission": "Owner", "isCurrentAccount": true},
                    [extraCollaborator]: {"permission": "Collaborator"}
                },
                "deployments": ["Production", "Staging"]
            })));

        it('should remove collaborator', ()=> am.addApp(name)
            .then(_=>am.addCollaborator(name, extraCollaborator))
            .then(_=>am.removeCollaborator(name, extraCollaborator))
            .then(_=>am.getApp(name))
            .then(expected({
                name,
                "collaborators": {
                    [collaborator]: {"permission": "Owner", "isCurrentAccount": true}
                },
                "deployments": ["Production", "Staging"]
            })));

        it('should list collaborator', ()=> am.addApp(name)
            .then(_=>am.addCollaborator(name, extraCollaborator))
            .then(_=>am.getCollaborators(name))
            .then(expected({
                [collaborator]: {"permission": "Owner", "isCurrentAccount": true},
                [extraCollaborator]: {"permission": "Collaborator"}
            })));
    });
    describe('deployment', function () {
        it('should add deployment', ()=> {
            const name = `deployment-add-${Date.now()}`;
            return am.addApp(name)
                .then(_=>am.addDeployment(name, 'NewDeployment'))
                .then(_=>am.getApp(name))
                .then(res=> {
                    expect(res.deployments.indexOf('NewDeployment') > -1).to.be.true;
                    delete res.deployments;
                    return res;
                })
                .then(expected({
                    "collaborators": {
                        [collaborator]: {
                            "isCurrentAccount": true,
                            "permission": "Owner"
                        }
                    },
                    name
                }));
        });

        it('should remove deployment', ()=> {
            const name = `deployment-add-${Date.now()}`;
            return am.addApp(name)
                .then(_=>am.removeDeployment(name, 'Production'))
                .then(_=>am.getApp(name))
                .then(expected({
                    "collaborators": {
                        [collaborator]: {
                            "isCurrentAccount": true,
                            "permission": "Owner"
                        }
                    },
                    "deployments": [
                        "Staging"
                    ],
                    name
                }));
        });

        it('should list deployment', ()=> {
            const name = `deployment-add-${Date.now()}`;
            return am.addApp(name)
                .then(_=>am.getDeployments(name))
                .then(deployments=> {
                    expect(deployments[0].name).to.eql("Production");
                    expect(deployments[1].name).to.eql("Staging");
                })
        });

        it('should add history to deployment', ()=> {
            const name = `deployment-add-${Date.now()}`;
            //noinspection CommaExpressionJS
            return am.addApp(name)
                .then(_=>am.getDeploymentHistory(name, 'Staging'))
                .then(expected([]))
                .then(_=>am.release(name, 'Staging', uploadFile, '1.0.0', {}))
                //this will trigger history
                .then(_=>am.release(name, 'Staging', uploadFile2, '1.0.0', {}))
                .then(_=>am.release(name, 'Staging', uploadFile3, '1.0.0', {}))
                .then(_=>am.getDeploymentHistory(name, 'Staging'))
                .then(history=> history.map(v=>(delete v.uploadTime, v)))
                .then(history=> {
                    expect(history.length).to.eql(3);
                });
            /* .then(expected([
             {
             "appVersion": "1.0.0",
             "blobUrl": "https://codepush.blob.core.windows.net/storagev2/UlC4pBQj6R3HnxWmNYSXWCMZ8XRvEyi8xQMDZ",
             "label": "v1",
             "manifestBlobUrl": "https://codepush.blob.core.windows.net/storagev2/Cbdc-lF4zS5B9frrVwGwfTsNLTx_Eyi8xQMDZ",
             "packageHash": "7d4a08789ff7b201dad44b7b782a1c9f06a24be30e3184536233fa1e26454764",
             "releaseMethod": "Upload",
             "releasedBy": "speajus2@gmail.com",
             "rollout": null,
             "size": 203902
             },
             {
             "appVersion": "1.0.0",
             "blobUrl": "https://codepush.blob.core.windows.net/storagev2/7ElqkWuKjIbUsBbLGWBNr9BTtznOEyi8xQMDZ",
             "diffPackageMap": {
             "7d4a08789ff7b201dad44b7b782a1c9f06a24be30e3184536233fa1e26454764": {
             "size": 174769,
             "url": "https://codepush.blob.core.windows.net/storagev2/xtGQVU7ngcG6PQR5avPPDPsVy49KEyi8xQMDZ"
             }
             },
             "label": "v2",
             "manifestBlobUrl": "https://codepush.blob.core.windows.net/storagev2/C8YOMC1T4AzGin45j12c60OPRSi7Eyi8xQMDZ",
             "packageHash": "463b2ed68f2e79b5874aa8fb9eaf9a17e24bbfe03f5fab95c3c3775b1f3fc568",
             "releaseMethod": "Upload",
             "releasedBy": "speajus2@gmail.com",
             "size": 203904
             }
             ]));
             */
        });

        it('should clear deployment history', ()=> {
            const name = `deployment-clear-${Date.now()}`;
            return am.addApp(name)
                .then(_=>am.release(name, 'Staging', uploadFile, '1.0', {}))
                .then(_=>am.release(name, 'Staging', uploadFile2, '1.0', {}))
                .then(_=>am.clearDeploymentHistory(name, 'Staging'))
                .then(_=>am.getDeploymentHistory(name, 'Staging'))
                .then(expected([]));
        });

        it('should rename deployment', ()=> {
            const name = `deployment-clear-${Date.now()}`;
            return am.addApp(name)
                .then(_=>am.renameDeployment(name, 'Staging', 'Whatever'))
                .then(_=> {
                    return am.getDeployment(name, 'Whatever')
                })
                .then(deployment=> {
                    expect(deployment).to.exist
                    expect(deployment.name).to.eql('Whatever');
                });
        });

        it('should get deployment metrics', ()=> {
            const name = `deployment-metrics-${Date.now()}`;
            return am.addApp(name)
                .then(_=> am.getDeploymentMetrics(name, 'Staging'))
                .then((r)=> {
                    console.log('r', r);
                })
                .then(_=>am.getDeployment(name, 'Staging'))

                .then(deployment=>P((resolve, reject)=> {
                    return aq({
                        clientUniqueId,
                        appVersion: '1.0.0',
                        deploymentKey: deployment.key,
                        headers: {
                            'Accept': 'application/text',
                            'content-type': 'application/json'
                        }
                    }).queryUpdateWithCurrentPackage({appVersion: '1.0.0'}, (e, o)=>e ? reject(e) : resolve(o))
                }))
                .then((obj)=> {
                    expect(obj).to.eql(null);
                })

                .then(_=>am.release(name, 'Staging', uploadFile, '1.0.0', {}))
                .then(_=>am.getDeployment(name, 'Staging'))
                .then(deployment=>P((resolve, reject)=> {
                    return aq({
                        clientUniqueId,
                        appVersion: '1.0.0',
                        deploymentKey: deployment.key
                    }).queryUpdateWithCurrentPackage({appVersion: '1.0.0'}, (e, o)=>e ? reject(e) : resolve(o))
                }).then(contains({
                    "deploymentKey": deployment.key,
                    "label": "v1",
                    "appVersion": "1.0.0",
                    "packageSize": 203902
                })).then(hasKeys('downloadUrl', 'packageHash')))

                .then(_=>am.getDeployment(name, 'Staging'))

                .then(deployment => P((resolve, reject)=>aq({
                    clientUniqueId,
                    appVersion: '1.0.0',
                    deploymentKey: deployment.key
                }).reportStatusDownload({label: 'v1'}, (e, o)=>e ? reject(e) : resolve(o)))

                    .then(_=> am.getDeploymentMetrics(name, 'Staging'))
                    .then(expected({
                        "v1": {
                            "active": 0,
                            "downloaded": 1,
                            "installed": 0,
                            "failed": 0
                        }
                    }))
                    .then(_=> P((resolve, reject)=>aq({
                        clientUniqueId,
                        appVersion: '1.0.0',
                        deploymentKey: deployment.key
                    }).reportStatusDeploy(deployment.package,
                        AcquisitionStatus.DeploymentSucceeded,
                        '1.0.0',
                        deployment.key,
                        (e, o)=>e ? reject(e) : resolve(o)
                    )))
                    .then(_=>am.getDeploymentMetrics(name, 'Staging'))
                    .then(expected({
                        "v1": {
                            "active": 1,
                            "downloaded": 1,
                            "failed": 0,
                            "installed": 1
                        }
                    })));
        });


        describe('patch', ()=> {
            const name = `patch-${Date.now()}`;
            it('should patch label', ()=> am.addApp(name)
                .then(_=>am.release(name, 'Staging', uploadFile, '1.0', {rollout: 25}))
                .then(_=>am.patchRelease(name, 'Staging', 'v1', {
                    appVersion: '2.0.0',
                    description: 'description',
                    isDisabled: true,
                    isMandatory: true,
                    rollout: 50
                }))
                .then(expected()));

            it('should fail patching rollout lower value', ()=> {
            });

        });
        describe('promote', ()=> {
            const name = `promote-${Date.now()}`;
            it('should promote', () => am.addApp(name)
                .then(_=>am.release(name, 'Staging', uploadFile, '1.0.0', {}))
                .then(_=>am.promote(name, 'Staging', 'Production', {rollout: 50}))
                .then(expected())
                .then(_=>am.getDeployment(name, 'Production'))
                .then(({name, package:{originalDeployment, rollout}})=> {
                    //what
                    expect(name).to.eql('Production');
                    expect(originalDeployment).to.eql('Staging');
                    expect(rollout).to.eql(50);
                }));
        });


        describe('release', ()=> {
            const name = `release-${Date.now()}`;
            it('should release', ()=> am.addApp(name)
                .then(_=>am.release(name, 'Production', uploadFile, '1.2.3', {
                    isDisabled: true,
                    description: 'super',
                    isMandatory: true
                }))
                .then(_=>am.getDeployment(name, 'Production'))
                .then(({name, package:{appVersion, isDisabled, isMandatory, description}})=> {
                    expect(name).to.eql('Production');
                    expect(appVersion).to.eql('1.2.3');
                    expect(isDisabled).to.be.true;
                    expect(isMandatory).to.be.true;
                    expect(description).to.eql('super');
                }));


        });

        describe('rollback', ()=> {
            const name = `rollback-${Date.now()}`;
            it('should rollback', () => am.addApp(name)
                .then(_=>am.release(name, 'Production', uploadFile, '1.0', {}))
                .then(_=>am.release(name, 'Production', uploadFile2, '1.0', {}))
                .then(_=>am.rollback(name, 'Production', 'v1'))
                .then(_=>am.getDeployment(name, 'Production'))
                .then(r => expect(r.package.label).to.eql('v3')));

        });

        describe('whoami', ()=> {
            it('should say who i am', () => am.getAccountInfo().then(v=>(delete v.name, v)).then(expected({
                "email": collaborator,
                "linkedProviders": [
                    "GitHub"
                ]
            })));
        });

        describe('session', ()=> {
            it('should return session', () => am.getSessions()
                .then(({length})=>expect(length).to.eql(1)));
        });
    })
});
