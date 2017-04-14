import factory from '../src/client';
import {expect} from 'chai';
import path from 'path';
const fixture = path.join.bind(path, __dirname, 'fixtures');

describe('client', function () {
    this.timeout(50000);
    it('should connect and drop tables', async () => {
        const client = await factory({keyspace: 'test_client', dangerouslyDropKeyspaceBeforeUse: true});
        expect(client).to.exist;

        await client.registerDirectoryAsync(fixture('m1'));

        expect(client.instance.Person).to.exist;

        await client.registerDirectoryAsync(fixture('m2'));
        expect(client.instance.Group).to.exist;


    });
    /**
     * authenticator: AllowAllAuthenticator
     > authenticator: PasswordAuthenticator
     * authorizer: AllowAllAuthorizer
     > authorizer: CassandraAuthorizer
     --- see (http://cassandra.apache.org/doc/latest/operating/security.html?highlight=authentication);
     */
    it.skip('should authenticate', async () => {
        const keyspace = 'test_client_auth';
        const username = 'tester_user';
        const password = 'zyxw9876';
        const client = await factory({
            keyspace,
            username: 'cassandra',
            password: 'cassandra',
            dangerouslyDropKeyspaceBeforeUse: true
        });

        await client.registerDirectoryAsync(fixture('m1'));

    })

});
