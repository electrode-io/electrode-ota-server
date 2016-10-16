"use strict";

const diregister = require('../diregister');

module.exports.register = diregister({
    name: 'ota!validate',
    dependencies: ['electrode:expose', 'ota!model'],
    multiple: false,
    connections: false
}, (options, expose, model) => {

    const {validateFunc} = model.account;

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
