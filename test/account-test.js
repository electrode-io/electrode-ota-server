/*const {client, reset} = require('../server/dao/cassandra/init')({
 keyspace: `test_account_wm_ota`,
 contactPoints: ['localhost']
 });*/
const init = require('../server/dao/cassandra/init')
const driver = require('cassandra-driver');
const Dao = require('../server/dao/cassandra/dao-cassandra');
const accountFactory = require('../server/model/account')
const expect = require('chai').expect;
const TOKEN = {profile: {email: 'test@t.com', name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}};

describe('model/account', function () {
    this.timeout(10000);
    let account;
    beforeEach(()=> init({contactPoints: ['localhost'], keyspace: 'ota_test'}).connect({reset: true}).then((client)=> {
        account = accountFactory(new Dao({client}));
    }));


    it('should createToken', ()=>account.createToken(TOKEN).then((t)=> {
        expect(t).to.exist;
        expect(t.email).to.eql("test@t.com");
    }));

    it('should add accessKey/listAcccessKeys', ()=> account.createToken({
        profile: {email: 'test@t.com', name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}
        //email, createdBy, friendlyName, ttl
    }).then(_=>account.addAccessKey(
        'test@t.com', 'test', 'newKey', 300
    )).then(v=> {
        expect(v.friendlyName).to.exist;
        expect(v).to.exist;
    }).then(_=>account.listAccessKeys('test@t.com'))
        .then(keys=> {
            expect(keys.length).to.eql(2);
            return account.invalidate(keys[1].name);
        })
        .then(_=>account.listAccessKeys('test@t.com'))
        .then(keys=> {
            expect(keys.length).to.eql(1);

        }));

    it('should validateFunc', ()=>account.createToken(TOKEN).then(token=>account.validateFunc(token.name).then(v=> {

        expect(v).to.exist;
        expect(v.email).to.eql('test@t.com');
    })));

    it('should removeAccessKey', ()=>account.createToken(TOKEN).then(_=>account.addAccessKey(
        'test@t.com',
        'test',
        'newKey',
        300
    )).then(v=> {
        return account.removeAccessKey({email: 'test@t.com', key: 'newKey'})
            .then(v=> {
                expect(v).to.be.true;
            })
            .then(_=>account.listAccessKeys('test@t.com')).then(u=> {
                expect(u.length).to.eql(1);
            })
    }));

    it('should updateAccessKey', ()=>account.createToken(TOKEN).then(_=>account.addAccessKey('test@t.com',
        'test',
        'newKey',
        300)).then(ak=>account.updateAccessKey({
        email: 'test@t.com',
        ttl: 0,
        friendlyName: 'stuff',
        key: 'newKey'
    }).then(v=> {
        expect(v).to.exist;
        expect(v.name).to.eql(ak.name);
        expect(v.friendlyName).to.eql('stuff');
    })));

    it('should linkProvider', ()=>account.createToken(TOKEN).then(_=>account.linkProvider({
        email: TOKEN.profile.email,
        provider: 'stuff'
    })

        .then(v=>account.findAccount(TOKEN.profile.email))
        .then(v=> {
            expect(v).to.exist;
            expect(v.linkedProviders).to.eql(['GitHub', 'stuff']);
        })));
    it('should not linkProvider', ()=>account.createToken(TOKEN).then(_=>account.linkProvider({
            email: TOKEN.profile.email,
            provider: 'github'
        }).then(()=> {
            throw new Error('Should have failed')
        }, (e)=> {
            expect(e).to.exist;
            expect(e.output.payload.error).to.eql('Conflict');
            return null;
        })
    ));
});
