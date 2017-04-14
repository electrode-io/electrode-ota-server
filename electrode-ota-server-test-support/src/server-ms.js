import agent from 'superagent';
import path from 'path';
import AccountManager from 'code-push/script/management-sdk';

const removeApps = (am, collaborator)=>am.getApps().then(apps=>Promise.all(apps.filter(({collaborators})=>collaborators[collaborator] && collaborators[collaborator].permission === 'Owner' && collaborators[collaborator].isCurrentAccount)
    .map(app=>am.removeApp(app.name))));

const amRemove = (args)=> {
    const [collaborator, ...rest] = args;
    return removeApps(new AccountManager(...rest), collaborator)
};

export default ()=> {
    console.warn(`
(((+++  WARNING +++)))  (((+++  WARNING +++)))  (((+++  WARNING +++)))  

This will remove all the apps under the account when its done running.  So make SURE
they are test accounts.  This is to ensure API Compatibility.



`);
    const conf = require(path.join(process.env.HOME, process.env.MS_CONFIG));
    return Promise.resolve(Object.assign(conf, {
        agent,
        stop(){
            return Promise.all([
                [conf.collaborator, conf.accessKey, {}, conf.serverUrl, conf.proxy],
                [conf.extraCollaborator, conf.extraAccessKey, {}, conf.serverUrl, conf.proxy],
            ].map(amRemove)).then(null, (e)=> {
                console.log('caught an error ', e.message);
            })
        }
    }));
};
