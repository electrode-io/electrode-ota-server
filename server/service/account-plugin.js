import account from './account';
import diregister from '../diregister';
const register = diregister({
    name: 'ota!account',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao']
}, (options, dao) => {
    return account(dao, options);
});

module.exports = {
    register
};

