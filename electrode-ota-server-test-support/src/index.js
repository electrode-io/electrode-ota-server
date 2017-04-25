import Boom from 'boom';

export const register = (plugin, options, next) => {

    plugin.auth.scheme('basic', authentication);
    next();

};

//Do not use this in production.
const validate = (users) => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Do not use this method for verification in production')
    }
    return (request, email, password, callback) => {
        if (password != users[email]) {
            return callback(null, false);
        }
        callback(null, true, {id: email, profile: {name: email, email}, provider: 'GitHub'});
    }
};

const authentication = function (server, {unauthorizedAttributes, realm, allowEmptyUsername = false, users = {}, validateFunc}) {

    validateFunc = validateFunc || validate(users);

    return {
        authenticate(request, reply) {

            const {authorization} = request.headers;
            if (realm & !authorization) {
                reply.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
                return reply.code(402);
            }

            if (!authorization) {
                return reply(Boom.unauthorized(null, 'Basic', unauthorizedAttributes));
            }

            const [authType, authValue] = authorization.split(/\s+/, 2);

            if (authType.toLowerCase() !== 'basic') {
                return reply(Boom.unauthorized(null, 'Basic', unauthorizedAttributes));
            }

            if (!authValue) {
                return reply(Boom.badRequest('Bad HTTP authentication header format', 'Basic'));
            }

            const [username, password] = new Buffer(authValue, 'base64').toString().split(':', 2);

            if (!username && !allowEmptyUsername) {
                return reply(Boom.unauthorized('HTTP authentication header missing username', 'Basic', unauthorizedAttributes));
            }

            validateFunc(request, username, password, (err, isValid, credentials) => {

                credentials = credentials || null;

                if (err) {
                    return reply(err, null, {credentials});
                }

                if (!isValid) {
                    return reply(Boom.unauthorized('Bad username or password', 'Basic', unauthorizedAttributes), null, {credentials: credentials});
                }

                if (!credentials || typeof credentials !== 'object') {

                    return reply(Boom.badImplementation('Bad credentials object received for Basic auth validation'));
                }

                // Authenticated

                return reply.continue({credentials});
            });
        }
    };

};

register.attributes = {
    name: 'basic',
    description: 'super basic auth mechanism'
};

