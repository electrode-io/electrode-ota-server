import factory from './index';

export default function init(clientOptions) {
    const connect = (opts) => factory({clientOptions}, opts.reset);
    return {
        connect
    }
};
