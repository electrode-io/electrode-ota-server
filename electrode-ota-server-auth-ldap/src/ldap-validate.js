import diregister from 'electrode-ota-server-diregister';
import ldapClient from './ldap-client';

export const register = diregister({
    name: 'ota!validate',
    dependencies: ['ota!account'],
    multiple: false,
    connections: false
}, (options, {validateFunc}) => {

    const _ldap = ldapClient(options);


    const token = (name, callback) => validateFunc(name).then(profile => callback(null, true, {
        email: profile.email,
        name
    }), () => callback(null, false));

    const session = (request, session, callback) => token(session.token, callback);


    return {
        ldap(r, username, password, callback){
            _ldap(username, password, (...args) => {
                //Prevent brute force. Should either crash or take to long to be useful.
                //also prevents checking for success by how long it takes to respond.
                // so logging in should take between .5 and 1.5s
                setTimeout(callback, 500 + (Math.random() * 1000), ...args);
            })
        },
        token,
        session
    };
});
