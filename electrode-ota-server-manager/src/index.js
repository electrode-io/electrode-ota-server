import path from 'path';
import inert from 'inert'
const _page = (content) => `<!DOCTYPE html>
<html>
<head>
    <title>Electrode Over the Air UI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css" rel="stylesheet" type="text/css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
	<link rel="icon" type="image/png" href="/favicon.png" >
</head>
<body>
${content}
</body>

</html>
`;

const _app = (data, src = (process.env.HOT ? 'http://localhost:4000/bundle.js' : "/manager/js/index.js")) => _page(`
<div id="container">
<div id="loading">Loading...</div>
</div>
<script  charset="utf-8" src="${src}"></script>
<script>
window.electrodeOtaUi.default(${JSON.stringify(data)}, 'container', void(0), ${JSON.stringify('/manager')}, function(){
    window.location.reload(true);
});
</script>
`);

export const register = (server, options, next) => {
    const uiPath = path.join(require.resolve("electrode-ota-ui"), '..');
    const assetPath =  path.join(__dirname, '..', 'assets');
    console.log('uiPath', uiPath, assetPath);
    server.register(inert, {}, function () {
        server.route([
            {
                method: 'GET',
                "path": "/manager/js/{param*}",
                "config": {
                    "auth": false,
                    "handler": {
                        "directory": {
                            "path":uiPath
                        }
                    }
                }
            },
            {
                method: 'GET',
                "path": "/manager/assets/{more*}",
                "config": {
                    "auth": false,
                    "handler": {
                        "directory": {
                            "path":assetPath
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/manager/logout',
                config: {
                    auth: {mode: 'optional'},
                    handler({cookieAuth, credentials, method}, reply){
                        reply.redirect('/logout').code(302);
                    }
                }
            },
            {
                method: 'GET',
                path: '/manager/{params*}',
                config: {
                    auth: {
                        strategy: "session",
                        mode: "try"
                    },
                    handler ({auth: {isAuthenticated, credentials = {}}, cookieAuth, info: {protocol = 'http', host, port, remoteAddress}}, reply) {
                        if (!isAuthenticated) {
                            return reply.redirect('/auth/login').code(302);

                        }
                        const {token, name, email} = credentials;
                        reply(_app({
                            authorization: {
                                email,
                                token: (token || name),
                                hostname: remoteAddress,
                                host: `${protocol}://${host}`
                            }
                        }));
                    }
                }
            }]);
        next();
    });
};

register.attributes = {name: 'electrode-ota-server-manager'};
