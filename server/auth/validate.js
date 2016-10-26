"use strict";

const diregister = require('../diregister');

module.exports.register = diregister({
    name: 'ota!validate',
    dependencies: ['electrode:expose', 'ota!account'],
    multiple: false,
    connections: false
}, (options, expose, {validateFunc}) => {


    const token = (name, callback)=>validateFunc(name).then(profile=> callback(null, true, {
        email: profile.email,
        name
    }), ()=>callback(null, false));

    expose({
        token,
        session(request, session, callback){
            return token(session.token, callback);
        }
    });

    return null;

});
