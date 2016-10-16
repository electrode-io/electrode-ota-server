const Boom = require('boom');

const notFound = (check, message = `Not Found`)=> {
    if (!check) throw Boom.notFound(message);
    return check;
};
const invalidRequest = (check, message = 'Invalid Request', data)=> {
    if (!check) throw Boom.expectationFailed(message, data);
    return check;
};

const alreadyExists = (check, name, type = 'app')=> {
    if (!check) throw Boom.conflict(`An ${type} named '${name}' already exists.`);
    return check;
};
const alreadyExistsMsg = (check, message)=> {
    if (!check) throw Boom.conflict(message);
    return check;
};

const notAuthorized = (check, message, data)=> {
    if (!check) throw Boom.unauthorized(message);
    return check;
};

const missingParameter = (check, param)=> {
    if (!check) throw Boom.expectationFailed(`Required param '${param}' is missing.`);
    return check;
};

const promiseError = (cb, ...args) => new Promise(()=>cb(...args));
module.exports = {
    notFound,
    invalidRequest,
    alreadyExists,
    notAuthorized,
    missingParameter,
    alreadyExistsMsg
};