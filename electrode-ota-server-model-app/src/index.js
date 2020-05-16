import diregister from "electrode-ota-server-diregister";
import app from './app';

export const register = diregister({
    name: 'ota!app',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!fileservice-upload', 'ota!logger', 'ota!ccm']
}, app);
