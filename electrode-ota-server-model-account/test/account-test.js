import initDao, {shutdown} from 'electrode-ota-server-test-support/lib/init-dao';
import accountFactory from 'electrode-ota-server-model-account/lib/account';
import {expect} from 'chai';
const TOKEN = {profile: {email: 'test@t.com', name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}};
const newToken = (email = 'test@t.com') => {
    return {profile: {email, name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}}
};

describe('model/account', function () {
    this.timeout(10000);
    let account;
    before(async () => {
        try {
            const dao = await initDao();
            account = accountFactory({}, dao, console);
        } catch (e) {
            console.log('model/account error');
            console.trace(e);
            throw e;
        }
    });

    after(shutdown);

    it('should createToken', () => account.createToken(newToken('createToken@t.com')).then((t) => {
        expect(t).to.exist;
        expect(t.email).to.eql("createToken@t.com");
    }));

    it('should add accessKey/listAcccessKeys', () => account.createToken({
        profile: {email: 'accessKey@t.com', name: 'test'}, provider: 'GitHub', query: {hostname: 'TestHost'}
        //email, createdBy, friendlyName, ttl
    }).then(_ => account.addAccessKey(
        'accessKey@t.com', 'test', 'newKey', 300
    )).then(v => {
        expect(v.friendlyName).to.exist;
        expect(v).to.exist;
    }).then(_ => account.listAccessKeys('accessKey@t.com'))
        .then(keys => {
            expect(keys.length).to.eql(2);
            return account.invalidate(keys[1].name);
        })
        .then(_ => account.listAccessKeys('accessKey@t.com'))
        .then(keys => {
            expect(keys.length).to.eql(1);

        }));

    it('should validateFunc', () => account.createToken(newToken('validateFunc@t.com')).then(token => account.validateFunc(token.name).then(v => {

        expect(v).to.exist;
        expect(v.email).to.eql('validateFunc@t.com');
    })));

    it('should removeAccessKey', () => account.createToken(newToken('removeAccessKey@t.com')).then(_ => account.addAccessKey(
        'removeAccessKey@t.com',
        'test',
        'newKey',
        300
    )).then(v => {
        return account.removeAccessKey({email: 'removeAccessKey@t.com', key: 'newKey'})
            .then(v => {
                expect(v).to.be.true;
            })
            .then(_ => account.listAccessKeys('removeAccessKey@t.com')).then(u => {
                expect(u.length).to.eql(1);
            })
    }));

    it('should updateAccessKey', () => account.createToken(TOKEN).then(_ => account.addAccessKey('test@t.com',
        'test',
        'newKey',
        300)).then(ak => account.updateAccessKey({
        email: 'test@t.com',
        ttl: 0,
        friendlyName: 'stuff',
        key: 'newKey'
    }).then(v => {
        expect(v).to.exist;
        expect(v.name).to.eql(ak.name);
        expect(v.friendlyName).to.eql('stuff');
    })));

    it('should linkProvider', () => account.createToken(newToken('linkProvider@t.com')).then(_ => account.linkProvider({
        email: 'linkProvider@t.com',
        provider: 'stuff'
    })

        .then(v => account.findAccount('linkProvider@t.com'))
        .then(v => {
            expect(v).to.exist;
            expect(v.linkedProviders).to.eql(['GitHub', 'stuff']);
        })));
    it('should not linkProvider', () => account.createToken(newToken('not-linkProvider@t.com')).then(_ => account.linkProvider({
            email: 'not-linkProvider@t.com',
            provider: 'github'
        }).then(() => {
            throw new Error('Should have failed')
        }, (e) => {
            expect(e).to.exist;
            expect(e.output.payload.error).to.eql('Conflict');
            return null;
        })
    ));
});
