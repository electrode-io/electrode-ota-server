export const register = (server, options, next) => {
    server.route(options);
    return next();
};

register.attributes = {name: 'electrode-ota-server-static'};

export default {register};
