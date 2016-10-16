const providers = require('bell/lib/providers');
const github = providers.github;
const primary = v=>v.primary;
module.exports = providers.github = (options={})=> {
    const ret = github(options);
    const oprofile = ret.profile;
    const api = options.api || 'https://api.github.com';

    ret.profile = (credentials, params, get, callback) => {
        oprofile(credentials, params, get, ()=> {
            if (!credentials.profile.email) {
                credentials.profile.email = `${credentials.profile.username}@${credentials.provider}`;
            }
            callback();
        });
    };
    return ret;

};
