const MySSOPlugin = {};

MySSOPlugin.register = function(server, options, next) {

    const scheme = (server, options) => {
        return {
            authenticate: (request, reply) => {
                return reply.continue({
                    credentials: {
                        name: "J Chen",
                        email: "test@walmartlabs.com",
                        loginId: "jchen"
                    }
                })
            }
        };
    };
    server.auth.scheme("my-sso-scheme", scheme);
    server.auth.strategy("my-sso-strategy", "my-sso-scheme");

    next();
};
MySSOPlugin.register.attributes = {
    name: "MySSOPlugin",
    version: "1.0.0"
};
module.exports = MySSOPlugin;