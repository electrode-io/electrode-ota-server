"use strict";

import diregister from '../diregister';

module.exports.register = diregister({
    name: 'ota!validate',
    dependencies: ['ota!account'],
    multiple: false,
    connections: false
}, (options, {validateFunc}) => {


    const token = (name, callback)=>validateFunc(name).then(profile=> callback(null, true, {
        email: profile.email,
        name
    }), ()=>callback(null, false));

    const session = (request, session, callback)=> {
        return token(session.token, callback);
    };

    return {
        token,
        session
    };
});
