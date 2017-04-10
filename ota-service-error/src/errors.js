const DEFAULT_OPTIONS = {
    message: 'Sorry, something went wrong, please retrace your steps.',
    statusCode: 500
};
exports.register = function error_handler(server, options = {}, next) {

    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    server.ext('onPreResponse', function ({response}, reply) {
        const {isBoom, output} = response;
        if (isBoom) {
            const payload = output.payload || opts;
            return reply(payload.message).code(payload.statusCode);
        }
        reply.continue();
    });
    next(); // continue with other plugins
};

exports.register.attributes = {
    name: 'boom-errors'
};
