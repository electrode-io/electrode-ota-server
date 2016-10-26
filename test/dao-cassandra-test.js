const init = require('../server/dao/cassandra/init');
const eql = require('./support/eql');
const Dao = require('../server/dao/cassandra/dao-cassandra');
const expect = require('chai').expect;


describe('dao/cassandra', function () {
    this.timeout(8000);
    let dao;
    before(()=> init({contactPoints: ['localhost'], keyspace: 'ota_test'}).connect({reset: true}).then((client)=> {
        dao = new Dao({client});
    }));
    it('should insert user', ()=> dao.createUser({email: 'joe@b.com', name: 'Joe'}).then((user)=> {
        expect(user.email).to.eql('joe@b.com');
        expect(user.linkedProviders).to.eql(['GitHub']);
        expect(user.name).to.eql('Joe');
        expect(user.id).to.exist;
    }));

    it('should fail insert user', (done)=> dao.createUser({email: 'joe@b.com', name: 'Joe'})
        .then(_=>dao.createUser({email: 'joe@b.com', name: 'Joe'}))
        .then(()=>done(new Error(`should have failed`)), (e)=> {
            expect(e.message).eql('User already exists joe@b.com');
            done();
        }));

    it('should insert and update keys', ()=> dao.createUser({
        email: 'joe1@b.com',
        name: 'Joe',
        accessKeys: {'abc': {name: 'key'}}
    }).then((user)=> {
        expect(user.accessKeys).to.eql({
            abc: {
                "name": "key",
                "expires": null,
                "description": null,
                "createdTime": null,
                "createdBy": null,
                "friendlyName": null,
                "lastAccess": null,
                "id": null
            }
        });
        user.accessKeys.abc.name = 'abc';
        user.accessKeys.def = {name: 'def'};
        return dao.updateUser(user.email, user).then(u=>u.accessKeys).then(eql({
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
        }));
    }));
    it(`should find user based on accessKey`, ()=> dao.createUser({
            email: 'joe2@b.com',
            name: 'Joe',
            accessKeys: {'abc123': {name: 'key'}}
        }).then(u=>dao.userByAccessKey('abc123')
            .then((fu)=>expect(fu.id.toJSON()).to.eql(u.id.toJSON())))
    );

    it('should add an app and find by collaborators', ()=>dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@t.com': {permission: 'Owner'}}
    }).then(app=> {
        const _id = app.id;
        expect(delete app.id).to.be.true;

        return dao.appsForCollaborator('test@t.com').then((all)=>expect(all[0].id.toJSON()).to.eql(_id.toJSON()));

    }));
    it('should add/remove/rename deployments', ()=> dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@t.com': {permission: 'Owner'}}
    }).then((app)=> {
        const appId = app.id;
        const getApp = ()=>dao.appById(appId);

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
            .then(_=>dao.removeDeployment(appId, 'staging'))
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
            .then(_=>dao.renameDeployment(appId, 'stuff', 'newStuff'))
            .then(getApp)
            .then(res=> {
                expect(res.deployments).to.eql(['newStuff']);
            })
            .then(_=>dao.removeDeployment(appId, 'newStuff'))
            .then(getApp)
            .then(res=> {
                expect(res.deployments).to.eql(null);
            })
            ;


    }));

    it('should find an app based on name and user', ()=> dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@t.com': {permission: 'Owner'}}
    }).then(_=>dao.createApp({
        name: 'Hello',
        deployments: {
            'staging': {
                key: '123'
            }
        },
        collaborators: {'test@nt.com': {permission: 'Owner'}}
    })).then(_=>dao.appForCollaborator('test@nt.com', 'Hello').then((app)=> {
        expect(app.name).to.eql('Hello');
        expect(Object.keys(app.collaborators)).to.eql(['test@nt.com']);

    })));

    it('should add a package to a deployment', ()=> {
        return dao.createApp({
            name: 'Hello',
            deployments: {
                'staging': {
                    key: '123'
                }
            },
            collaborators: {'test@t.com': {permission: 'Owner'}}
        }).then(app=> {
            return dao.addPackage('123', {
                packageHash: 'abc',
                description: 'This is a package'
            });
        }).then(_=>dao.deploymentForKey('123')).then(dep=> {
            expect(dep.package.description).to.eql("This is a package");


        });
    });
    it('should add remove an app with a deployment', ()=> {
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
        }).then(app=>dao.addPackage('123', {
            packageHash: 'abc',
            description: 'This is a package'
        }).then(_=>dao.removeApp(app.id))
            .then(_=>dao.appsForCollaborator('addremove@t.com')))
            .then(apps=>expect(apps).to.eql([]));

    });
    it('should get deployments by keys', ()=> dao.createApp({
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
        }).then(app=> dao.deploymentsByApp(app.id, app.deployments))
            .then(deployments=> {
                expect(deployments.staging).to.exist;
                expect(deployments.other).to.exist;
            })
    );
});

