const Vision = require('vision');
const ejs = require('ejs');

const register = (server, options, next)=> {

    server.register(Vision, (err) => {

        if (err) {
            throw err;
        }

        server.views({
            engines: {ejs},
            relativeTo: __dirname,
            path: 'templates',
            layout: true
        });
        return next();
    });
};

register.attributes = {name: 'views'};

module.exports = {register};
