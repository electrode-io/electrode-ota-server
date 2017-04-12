import {notAuthorized, Boom} from 'electrode-ota-server-errors';
const {badRequest, badImplementation} = Boom;

export const register = (plugin, options, next) => {

    plugin.auth.scheme('basic', authentication);
    next();

};

const authentication = function (server, options) {
    let {unauthorizedAttributes, realm, allowEmptyUsername = false, validateFunc} = options;
    unauthorizedAttributes = unauthorizedAttributes || {realm};
    return {
        authenticate(request, reply) {

            const authorization = request.headers && request.headers.authorization;
            if (realm && authorization == null) {
                return reply(notAuthorized('No Credentials Given', 'Basic', unauthorizedAttributes));
            }

            const [authType, authValue] = authorization.split(/\s+/, 2);

            if (authType.toLowerCase() !== 'basic') {
                return reply(notAuthorized(null, 'Basic', unauthorizedAttributes));
            }

            if (!authValue) {
                return reply(badRequest('Bad HTTP authentication header format', 'Basic'));
            }

            const [username, password] = new Buffer(authValue, 'base64').toString().split(':', 2);

            if (!username && !allowEmptyUsername) {
                return reply(notAuthorized('HTTP authentication header missing username', 'Basic', unauthorizedAttributes));
            }

            validateFunc(request, username, password, (err, isValid, credentials) => {

                credentials = credentials || null;

                if (err) {
                    return reply(err, null, {credentials});
                }

                if (!isValid) {
                    return reply(notAuthorized('Bad username or password', 'Basic', unauthorizedAttributes), null, {credentials: credentials});
                }

                if (!credentials || typeof credentials !== 'object') {

                    return reply(badImplementation('Bad credentials object received for Basic auth validation'));
                }

                // Authenticated

                return reply.continue({credentials});
            });
        }
    };

};

register.attributes = {
    name: 'http-basic',
    description: 'super basic auth mechanism'
};

