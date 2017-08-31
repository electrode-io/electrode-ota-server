import {id, values, genString} from 'electrode-ota-server-util';
import {notFound, notAuthorized, alreadyExistsMsg} from 'electrode-ota-server-errors';

const TTL = 60 * 24 * 3600 * 1000;
const asTrue = () => true;
const findByFriendlyName = function ({friendlyName}) {
    return friendlyName == this;
};

const genAccessKey = ({email, createdBy, friendlyName, description, ttl = TTL}) => {

    const createdTime = Date.now();
    const token = genString();
    const expires = createdTime + ttl;

    if (!friendlyName) {
        friendlyName = `Login-${expires}`;
    }
    description = description || friendlyName;
    return {
        name: token,
        email,
        createdTime,
        createdBy,
        description,
        expires,
        friendlyName,
        id: id()
    };
};
export default function (options, dao) {
    return {

        listAccessKeys(email) {
            return dao.userByEmail(email).then(({accessKeys = {}}) => values(accessKeys));
        },

        async addAccessKey(email, createdBy, friendlyName, ttl) {
            const ak = genAccessKey({email, createdBy, friendlyName, ttl});
            const user = await  dao.userByEmail(email);

            notFound(user, `No user registered for ${email}.`);
            user.accessKeys[ak.name] = ak;
            const updated = await dao.updateUser(email, user);
            return updated.accessKeys[ak.name];
        },

        createToken({profile = {}, provider, query = {}}) {

            const email = profile.email || profile.username;
            const ak = genAccessKey({email, createdBy: query.hostname});
            const accessKeys = {[ak.name]: ak};
            const account = {
                name: profile.displayName,
                id: id(),
                email,
                accessKeys,
                created: Date.now(),
                linkedProviders: [provider && provider == 'github' ? 'GitHub' : provider]
            };

            return dao.createUser(account).then(v => ak);
        },

        invalidate(token){
            return dao.userByAccessKey(token).then(user => {
                delete user.accessKeys[token];
                return dao.updateUser(user.email, user).then(asTrue);
            });
        },

        account(email){
            return dao.userByEmail(email).then(account => {
                notFound(account, `could not find account for ${email}`);
                return {account};
            });
        },

        validateFunc(token)
        {
            return dao.userByAccessKey(token).then(user => {
                const account = notFound(user.accessKeys[token], `No token found for ${token}.`);
                notAuthorized(account.expires > Date.now(), `Token is not valid`);
                account.lastAccess = Date.now();
                return dao.updateUser(user.email, user).then(v => user);
            });
        },

        removeAccessKey({email, key})
        {
            return dao.userByEmail(email).then((user) => {
                const ak = notFound(user.accessKeys[key] || Object.keys(user.accessKeys).map(ak => user.accessKeys[ak]).find(findByFriendlyName, key), `AccessKey ${key} not found for user`);
                delete user.accessKeys[ak.name];
                return dao.updateUser(email, user).then(asTrue);
            });
        },
        linkProvider({email, provider})
        {
            return dao.userByEmail(email).then((user) => {
                notFound(user, 'User was not found for email');
                alreadyExistsMsg(!user.linkedProviders.find(v => v.toLowerCase() == provider.toLowerCase()), 'Account is already linked to provider');
                user.linkedProviders.push(provider);
                return dao.updateUser(email, user).then(asTrue);
            });
        },

        updateAccessKey(params){
            const {email, friendlyName, key, ttl} = params;
            return dao.userByEmail(email).then((user) => {
                const accessKey = notFound(Object.keys(user.accessKeys).map(k => user.accessKeys[k]).find(findByFriendlyName, key), `AccessKey ${key} not found for user`);

                if (ttl) {
                    accessKey.expires = Date.now() + ttl;
                }
                if (friendlyName) {
                    accessKey.friendlyName = friendlyName;
                }
                return dao.updateUser(email, user).then(u => u.accessKeys[accessKey.name]);

            });
        },
        findAccount(email){
            return dao.userByEmail(email);
        }
    }
};
