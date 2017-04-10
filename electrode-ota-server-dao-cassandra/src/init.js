import factory from './index';

export default function init(clientOptions) {
    const connect = (opts) => {
        console.log('using options', clientOptions, opts);
        return factory({clientOptions}, opts.reset);
    };


    return {
        connect
    }
};
