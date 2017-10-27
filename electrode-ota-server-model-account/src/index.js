import account from './account';
import diregister from "electrode-ota-server-diregister";

export const register = diregister({
    name: 'ota!account',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!logger']
}, account);
