import aquistion from './acquisition';
import diregister from '../diregister';
export const register = diregister({
    name: 'ota!acquisition',
    multiple: false,
    connections: false,
    dependencies: ['ota!dao', 'ota!weighted', 'ota!fileservice-download', 'ota!manifest']
}, (options, dao, weighted, download, manifest) => aquistion(dao, weighted, download, manifest, options));
