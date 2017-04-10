import diregister from '../diregister';
import app from './app';

export const register = diregister({
    name: 'ota!app',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!fileservice-upload']
}, (options, dao, upload) => app(dao, upload, options));

