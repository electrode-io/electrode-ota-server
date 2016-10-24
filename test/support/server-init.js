const path = require('path');
const init = require('../../server/dao/cassandra/init')
const driver = require('cassandra-driver');
process.env.NODE_ENV = 'test';
process.env.PORT = 9999;
process.env.OTA_CONFIG_DIR = path.join(__dirname, '..', 'config');

const accountFactory = require('../../server/model/account')
const Dao = require('../../server/dao/cassandra/dao-cassandra');
const otaServer = require("../../index");
const supertest = require('supertest');
const {makeRequester, tokenRe, auth} = require('./request');

module.exports = ()=> init({
    contactPoints: ['localhost'],
    keyspace: 'ota_server_test'
}).connect({reset: true}).then(client=> {

    return otaServer().then((server)=> {
        const request = makeRequester(server);
        const makeUser = (user)=> {
            return request({
                method: 'GET',
                url: '/auth/register/basic',
                headers: {
                    authorization: auth(user, "abc123")
                }
            }, ({statusCode, headers})=> {
                return request({
                        url: headers.location,
                        headers: {
                            Cookie: headers['set-cookie'][0].split(';')[0]
                        }
                    },
                    ({result})=> (tokenRe.exec(result)[1])
                )
            });
        };

        return makeUser('test@walmartlabs.com').then((extraAccessKey)=> makeUser('test2@walmartlabs.com').then(accessKey=> {
            return {
                serverUrl: `http://localhost.walmart.com:${process.env.PORT}`,
                agent: supertest(server.listener),
                accessKey,
                extraAccessKey,
                collaborator: 'test2@walmartlabs.com',
                extraCollaborator: 'test@walmartlabs.com',
                stop(){
                   return server && server.stop();
                }
            }
        }));
    });
});

//require('./management-sdk-suite');
