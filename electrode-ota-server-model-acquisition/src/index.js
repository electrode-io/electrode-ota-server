import aquistion from './acquisition';
import diregister from "electrode-ota-server-diregister";
export const register = diregister({
    name: 'ota!acquisition',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!weighted', 'ota!fileservice-download', 'ota!manifest']
}, aquistion);
