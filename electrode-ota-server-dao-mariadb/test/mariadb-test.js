import initMariaDao, {shutdownMaria} from 'electrode-ota-server-test-support/lib/init-maria-dao';
import eql from 'electrode-ota-server-test-support/lib/eql';
import {expect} from 'chai';
import sinon from 'sinon';

const alwaysFail = () => {
    throw new Error(`should have failed`);
}

describe('dao/mariadb', function() {
    this.timeout(200000);
    let dao;
    let clock;
    before(async () => {
        dao = await initMariaDao();
        clock = sinon.useFakeTimers({now: 1483228800000});
    });
    after(async () => {
        await shutdownMaria();
        clock.restore();
    });

    it('should insert user', () => dao.createUser({email: 'joe@b.com', name: 'Joe', linkedProviders:['GitHub']})
        .then((user) => {
            expect(user.email).to.eql('joe@b.com');
            expect(user.linkedProviders).to.eql(['GitHub']);
            expect(user.name).to.eql('Joe');
            expect(user.id).to.exist;
        })
    );

    it('should fail insert user on duplicate email', () => dao.createUser({email: 'joe@c.com', name: 'JoeC'})
        .then(_ => dao.createUser({email: 'joe@c.com', name: 'Joe'}))
        .then(alwaysFail, (e) => {
            expect(e.message).eql('User already exists joe@c.com');
        }));

    it('should find by id', () => dao.createUser({email: 'joe@d.com', name: 'Joe D'})
        .then((user) => dao.userById(user.id))
        .then((foundUser) => {
            expect(foundUser.email).to.eql('joe@d.com');
            expect(foundUser.name).to.eql('Joe D');
        })
    );

    it('should find by email', () => dao.createUser({email: 'joe@e.com', name: 'Joe E'})
        .then((user) => dao.userByEmail('joe@e.com'))
        .then((foundUser) => {
            expect(foundUser.email).to.eql('joe@e.com');
            expect(foundUser.name).to.eql('Joe E');
        })
    );

    it('should insert and update keys', () => dao.createUser({
        email: 'joe1@f.com',
        name: 'Joe F',
        accessKeys: {'abc': {name: 'key'}}
    }).then((user) => {
        expect(user.accessKeys).to.have.property('abc').with.property('name', 'key');
        user.accessKeys.abc.name = 'abc';
        user.accessKeys.def = {name: 'def'};
        return dao.updateUser(user.email, user)
            .then(u => u.accessKeys)
            .then(eql({
                "abc": {
                    "name": "abc",
                    "expires": null,
                    "description": null,
                    "lastAccess": null,
                    "createdTime": null,
                    "createdBy": null,
                    "friendlyName": null,
                    "id": null
                },
                "def": {
                    "name": "def",
                    "expires": null,
                    "description": null,
                    "createdTime": null,
                    "lastAccess": null,
                    "createdBy": null,
                    "friendlyName": null,
                    "id": null
                }
        }))
        .then(_ => dao.userByEmail(user.email))
        .then(u => expect(u.accessKeys).to.include.all.keys('abc', 'def'));
    }));

    it(`should find user based on accessKey`, () => dao.createUser({
        email: 'joe2@g.com',
        name: 'Joe G',
        accessKeys: {'abc123': {name: 'key',
            expires: new Date(1997,0,0),
            description: "Description",
            friendlyName: "Friendly",
        }}
        }).then(u => dao.userByAccessKey('abc123')
            .then((fu) => {
                expect(fu.id).to.eql(u.id);
                expect(fu.accessKeys['abc123'].name).to.eql('key');
                expect(fu.accessKeys['abc123'].expires).to.eql(new Date(1997,0,0));
                expect(fu.accessKeys['abc123'].description).to.eql("Description");
                expect(fu.accessKeys['abc123'].friendlyName).to.eql("Friendly");
            }))
    );

    it('should add an app and find by collaborators', () => dao.createApp({
        name: 'Hello2',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@t.com': {permission: 'Owner'}}
    }).then(app => {
        const {id} = app;

        return dao.appsForCollaborator('test@t.com')
            .then((all) => expect(JSON.stringify(all[0].id)).to.eql(JSON.stringify(id)));

    }));

    it('should update app collaborators', () => dao.createApp({
        name: 'ByeBye',
        collaborators: { 'friend@walmart.com': {permission: 'Friend'}}
    }).then(app => {
        expect(app.name).to.eql('ByeBye');
        return dao.updateApp(app.id, {
            name: 'ByeBye2',
            collaborators: {
                'friend1@walmart.com': {permission: 'Friend'},
                'friend2@walmart.com': {permission: 'Friend'}
            }
        });
    }).then(app => {
        expect(app.name).to.eql('ByeBye2');
        expect(app.collaborators).to.eql({
            'friend1@walmart.com': {permission: 'Friend'},
            'friend2@walmart.com': {permission: 'Friend'}
        });
    }));

    it('should add/remove/rename deployments', () => dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@t.com': {permission: 'Owner'}}
    }).then((app) => {
        const appId = app.id;
        const getApp = () => dao.appById(appId);

        return dao.addDeployment(appId, 'stuff', {key: 'stuff'})
            .then(getApp)
            .then(eql({
                "collaborators": {
                    "test@t.com": {
                        "permission": "Owner"
                    }
                },
                "deployments": [
                    "staging", "stuff"
                ],
                "name": "Hello"
            }))
            .then(_ => dao.removeDeployment(appId, 'staging'))
            .then(getApp)
            .then(eql({
                "collaborators": {
                    "test@t.com": {
                        "permission": "Owner"
                    }
                },
                "deployments": [
                    "stuff"
                ],
                "name": "Hello"
            }))
            .then(_ => dao.renameDeployment(appId, 'stuff', 'newStuff'))
            .then(getApp)
            .then(res => {
                expect(res.deployments).to.eql(['newStuff']);
            })
            .then(_ => dao.removeDeployment(appId, 'newStuff'))
            .then(getApp)
            .then(res => {
                expect(res.deployments).to.eql(null);
            });
    }));

    it('should find an app based on name and user', () => dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@t.com': {permission: 'Owner'}}
    }).then(_ => dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@nt.com': {permission: 'Owner'}}
    })).then(_ => dao.appForCollaborator('test@nt.com', 'Hello').then((app) => {
        expect(app.name).to.eql('Hello');
        expect(Object.keys(app.collaborators)).to.eql(['test@nt.com']);

    })));

    it('should add a package to a deployment', () => {
        return dao.createApp({
            name: 'Hello',
            deployments: {
                'staging': {
                    key: '123'
                }
            },
            collaborators: {'test@t.com': {permission: 'Owner'}}
        }).then(app => {
            return dao.addPackage('123', {
                packageHash: 'abc',
                description: 'This is a package'
            });
        }).then(_ => dao.deploymentForKey('123')).then(dep => {
            expect(dep.package.description).to.eql("This is a package");
        });
    });

    it('should add remove an app with a deployment', () => {
        return dao.createApp({
            name: 'Hello',
            deployments: {
                'staging': {
                    key: '123'
                },
                'other': {
                    key: '456'
                }
            },
            collaborators: {'addremove@t.com': {permission: 'Owner'}}
        }).then(app => dao.addPackage('123', {
            packageHash: 'abc',
            description: 'This is a package'
        }).then(_ => dao.removeApp(app.id))
            .then(_ => dao.appsForCollaborator('addremove@t.com')))
            .then(apps => expect(apps).to.eql([]));

    });

    it('should get deployments by keys', () => dao.createApp({
            name: 'Hello',
            deployments: {
                'staging': {
                    key: '123'
                },
                'other': {
                    key: '456'
                }
            },
            collaborators: {'test@t.com': {permission: 'Owner'}}
        }).then(app => dao.deploymentsByApp(app.id, app.deployments))
            .then(deployments => {
                expect(deployments.staging).to.exist;
                expect(deployments.other).to.exist;
            })
    );

    it('should get single deployment by key', () => dao.createApp({
            name: 'HelloApp',
            deployments: {
                'single': { key: 'aaa' },
                'other': { key: 'bbb' }
            }
        }).then(app => dao.deploymentByApp(app.id, 'single'))
        .then(deployment => {
            expect(deployment).to.exist;
            expect(deployment.key).to.equal('aaa');
        })
    );

    it('history by id', () => dao.createApp({
            name: 'History by id',
            deployments: {
                'staging': { key: 'history_by_ids' }
            }
        }).then(app => dao.addPackage('history_by_ids', {
                    packageHash: 'pkg1',
                    description: 'Package 1',
                    created_: 123455
                }).then(_ => clock.tick(1000))
                .then(_ => dao.addPackage('history_by_ids', {
                    packageHash: 'pkg2',
                    description: 'Package 2'
                }))
                .then(_ => clock.tick(1000))
                .then(_ => dao.addPackage('history_by_ids', {
                    packageHash: 'pkg3',
                    description: 'Package 3'
                }))
            .then(_ => dao.history(app.id, 'staging'))
            .then(histories => dao.historyByIds(histories.map(h => h.id_)))
            .then(pkgs => {
                expect(pkgs).has.length(3);
                expect(pkgs[0].packageHash).to.equal('pkg1');
                expect(pkgs[1].packageHash).to.equal('pkg2');
                expect(pkgs[2].packageHash).to.equal('pkg3');
            })
        )
    );

    it('history by label', () => dao.createApp({
            name: 'History by Label',
            deployments: {
                'staging': { key: 'history_by_label' }
            }
        }).then(app => dao.addPackage('history_by_label', {
                packageHash: 'package1',
                description: 'Package 1 with label BLUE',
                label: 'BLUE'
            })
            .then(_ => dao.addPackage('history_by_label', {
                packageHash: 'package2',
                description: 'Package 2 with label RED',
                label: 'RED'
            }))
            .then(_ => dao.historyLabel(app.id, 'staging', 'RED'))
            .then(pkg => {
                expect(pkg.packageHash).to.equal('package2');
            })
        )
    );

    it('should clear deployment history', () => dao.createApp({
            name: 'App to clear',
            deployments: {
                'staging': {
                    key: 'delete_me'
                }
            }
        }).then(app => dao.addPackage('delete_me', {
                packageHash: 'def',
                description: 'This is a package to delete'
            })
            .then(_ => dao.history(app.id, 'staging'))
            .then(history => {
                expect(history).to.have.length(1);
                expect(history[0].packageHash).to.equal('def');
                expect(history[0].description).to.equal('This is a package to delete');
            })
            .then(_ => dao.clearHistory(app.id, 'staging'))
            .then(_ => dao.history(app.id, 'staging'))
            .then(history => expect(history).to.be.empty)
        )
    );

    it('should set and update isDisabled and isMandatory', () => dao.createApp({
            name: 'App with disabled and mandatory packages',
            deployments: {
                'staging': { key: 'staging_disabled_mandatory' }
            }
        }).then(app => dao.addPackage('staging_disabled_mandatory', {
            packageHash: 'mandatory_package_hash',
            description: 'Mandatory package',
            isMandatory: true
            }).then(_ => dao.history(app.id, 'staging'))
            .then(history => {
                expect(history[0].packageHash).to.equal('mandatory_package_hash');
                expect(history[0].isMandatory).is.true;
                expect(history[0].isDisabled).is.false;
                history[0].isMandatory = false;
                history[0].isDisabled = true;
                return dao.updatePackage('staging_disabled_mandatory', history[0]);
            }).then(pkg => {
                expect(pkg.isMandatory).is.false;
                expect(pkg.isDisabled).is.true;
            })
        )
    );

    it('save diffPackage', () => dao.createApp({
            name: 'App to test diffPackage',
            deployments: { 'staging': { key: 'staging_diff_package' }}
        }).then(app => {
            return dao.addPackage('staging_diff_package', {
                packageHash: 'hash1ForDiff',
                description: 'Package for testing Diff packages'
            })
            .then(pkg => {
                expect(pkg.diffPackageMap).to.be.empty;
                pkg.diffPackageMap['diff_pkg_1'] = { url: 'url1', size:100 };
                return dao.updatePackage('staging_diff_package', pkg);
            })
            .then(pkg => {
                pkg.diffPackageMap['diff_pkg_2'] = { url: 'url2', size:101 };
                return dao.updatePackage('staging_diff_package', pkg);
            })
            .then(pkg => dao.packageById(pkg.id_))
            .then(pkg => {
                expect(Object.keys(pkg.diffPackageMap)).to.have.all.members(['diff_pkg_1', 'diff_pkg_2']);
            });
        })
    );

    it('should insert and get metrics', () => dao.createApp({
            name: 'appWIthDeployment',
            deployments: { 'staging': { key: '5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-'}}
        }).then(app => dao.insertMetric({
            "appVersion": "1.0.0",
            "deploymentKey": "5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-",
            "clientUniqueId": "fe231438a4f62c70",
            "label": "v1",
            "status": "DeploymentSucceeded",
            "previousLabelOrAppVersion": "1.0.0",
            "previousDeploymentKey": "5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-"
        }))
        .then(_ => dao.metrics('5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-'))
        .then(eql([
            {
                "appVersion": "1.0.0",
                "deploymentKey": "5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-",
                "clientUniqueId": "fe231438a4f62c70",
                "label": "v1",
                "status": "DeploymentSucceeded",
                "previousLabelOrAppVersion": "1.0.0",
                "previousDeploymentKey": "5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-"
            }
        ]))
    );

    it('should insert and retrieve client ratio', () => dao.insertClientRatio('clientUniqueId1', 'packageHash1', 12.0, true)
        .then(_ => dao.clientRatio('clientUniqueId1', 'packageHash1'))
        .then(ratio => {
            expect(ratio.updated).to.equal(true);
            expect(ratio.ratio).to.equal(12.0);
        })
        .then(_ => dao.clientRatio('clientUniqueid1', 'packageHashNonExistant'))
        .then(ratio => {
            expect(ratio).is.null;
        })
    );

    it('upload and download package content', () => dao.upload('a-package-hash', 'This is the package content')
        .then(_ => dao.download('a-package-hash'))
        .then(content => {
            expect(content + '').to.equal('This is the package content');
        })
    );

});