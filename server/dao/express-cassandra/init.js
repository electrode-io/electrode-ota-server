const cassandra = require('cassandra-driver');

const factory = require('./index');


module.exports = function init(clientOptions) {
    const connect = (opts) => factory({clientOptions}, opts.reset);
    return {
        connect
    }
};
