import account from './account';
import diregister from '../diregister';

export const register = diregister({
    name: 'ota!account',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao']
}, (options, dao) => account(dao, options));
