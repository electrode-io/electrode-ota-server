const DEFAULT_OPTIONS = {
    message: 'Sorry, something went wrong, please retrace your steps.',
    statusCode: 500
};
exports.register = function error_handler(server, options = {}, next) {

    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    server.ext('onPreResponse', function ({response}, reply) {
        if (response.isBoom) {
            const payload = response.output.payload || opts;

            return apply(reply(payload.message), response.output.headers).code(payload.statusCode);
        }
        reply.continue();
    });
    next(); // continue with other plugins
};

function apply(res, headers) {
    if (!headers) return res;

    Object.keys(headers).forEach(function (key) {
        res.header(key, headers[key]);
    });

    return res;
}

exports.register.attributes = {
    name: 'boom-errors'
};
