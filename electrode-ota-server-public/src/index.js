import _inert from 'inert';
import path from 'path';

function register(server, {inert = {}, config = {}, ...options}, next) {
    server.register(_inert, inert, function (e, o) {

        options.config = config;
        if (!config.handler) {
            config.handler = {};
        }
        if (!config.handler.directory) {
            config.handler.directory = {};
        }
        if (!config.handler.directory.path) {
            config.handler.directory.path = path.join(__dirname, '..', 'public');
        }
        server.route(options);
        next();
    });
}

register.attributes = {name: 'electrode-ota-server-static'};
export default {register};
