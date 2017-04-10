import path from 'path';
import init from './init-dao';
import otaServer from 'electrode-ota-server';
import supertest from 'supertest';
import {makeRequester, tokenRe, auth} from './request';
process.env.OTA_CONFIG_DIR = path.join(__dirname, 'config');
process.env.NODE_ENV = 'test';
process.env.PORT = 9999;

export default () => init().then(client => {

    return otaServer().then((server) => {
        const request = makeRequester(server);
        const makeUser = (user) => {
            return request({
                method: 'GET',
                url: '/auth/register/basic',
                headers: {
                    authorization: auth(user, "abc123")
                }
            }, ({statusCode, headers}) => {
                return request({
                        url: headers.location,
                        headers: {
                            Cookie: headers['set-cookie'][0].split(';')[0]
                        }
                    },
                    ({result}) => (tokenRe.exec(result)[1])
                )
            });
        };

        return makeUser('test@walmartlabs.com').then((extraAccessKey) => makeUser('test2@walmartlabs.com').then(accessKey => {
            return {
                serverUrl: `http://localhost.walmart.com:${process.env.PORT}`,
                aquistionServerUrl: `/`,
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

