import diregister from '../diregister';
export const CONFIG = {
    weighted(weight){
        return Math.random() < (weight / 100);
    }
};
export const register = diregister({
    name: 'ota!weighted',
    multiple: false,
    connections: false,
    dependencies: []
}, () => CONFIG.weighted);
