"use strict";

const {wrap} = require('../util');
const diregister = require('../diregister');
const _page = (content = '', title = 'Electrode OTA')=>`<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
   <head>
    <meta charset="utf-8" />
    <link href="/assets/style.css" rel="stylesheet">
   <title>${title}</title>
   </head>
   <body>
   
   <div class="fullscreen-bg">
    <video loop muted autoplay poster="/assets/background.jpg" class="fullscreen-bg__video">
        <source src="/assets/movie.mpg" type="video/mp4">
    </video>
   </div>
   <div class="container">
    ${content}   
   </div>
 
   </body>
</html>`;

const _tokenPage = ({name})=>_page(`
    <h1>Over the Air Token</h1>
    <div>Access Token: <span class="token">${name}</span></div>
    <span>Please close this window after copying this token</span>
`);
const _loginChoice = (type = 'login', providers = [], hostname = "")=>_page(`
  
        The following authentication providers are avialable:
        <ul>            
            ${providers.map(({
    icon:{
        height = 50,
        width = 50,
        src
    }, name, label
})=>`<li><a href="/auth/${type}/${name}?hostname=${hostname}"><img class="icon ${name}" height="${height}" width="${width}" src="${src}">${label}</a></li>`).join('')}
        </ul>
`);
const _errorPage = ({message = 'Sorry, an error occurred'}, href = "/auth/login")=>_page(`
<div className="error">
<a href="${href}">${message || 'Sorry, an error occurred'}</a>
</div>
`);
const register = diregister({
    name: 'authRoute',
    dependencies: ['electrode:route', 'ota!model'],
}, (options, route, model, tokenPage = _tokenPage, loginChoice = _loginChoice, errorPage = _errorPage) => {


    const acf = model.account;

    const {invalidate, addAccessKey, createToken} = wrap({
        invalidate: acf.invalidate,
        addAccessKey: acf.addAccessKey,
        createToken: acf.createToken
    });

    route([
        {
            method: 'GET',
            path: '/auth/login',
            config: {
                auth: false,
                handler({query:{hostname}}, reply){
                    reply(loginChoice("login", options.providers, hostname));
                }
            }
        },
        {
            method: 'GET',
            path: '/auth/register',
            config: {
                auth: false,
                handler({query:{hostname}}, reply){
                    reply(loginChoice('register', options.providers, hostname));
                }
            }
        }, {
            method: 'GET',
            path: '/accesskey',
            config: {
                auth: {
                    mode: "try",
                    strategy: "session"
                },
                handler({cookieAuth, auth:{isAuthenticated, credentials}} = {
                    auth: {
                        isAuthenticated: false,
                        credentials: {}
                    }
                }, reply) {
                    if (!isAuthenticated) {
                        return reply.redirect('/auth/login').code(302);
                    }
                    cookieAuth && cookieAuth.clear();
                    return reply(tokenPage(credentials));
                }
            }
        },
        {
            method: 'GET',
            path: '/auth/link',
            config: {
                auth: false,
                handler(request, reply){
                    reply(loginChoice("login", options.providers));
                }
            }
        },

        {
            method: 'GET',
            path: '/',
            config: {
                auth: false,
                handler(request, reply){
                    reply.redirect('/auth/login').code(302);
                }
            }
        },
        {
            method: 'GET',
            path: '/authenticated',
            config: {
                auth: {
                    strategy: "bearer",
                    mode: 'optional'
                },
                handler(request, reply){
                    reply({
                        "authenticated": request.auth.isAuthenticated
                    });
                }
            }
        }, {
            method: 'GET',
            path: '/logout',
            config: {
                auth: {mode: 'optional', strategies: ['session', 'bearer']},
                handler(request, reply) {
                    invalidate(request.auth.credentials && request.auth.credentials.name, (e)=> {
                        if (e) {
                            console.log('error logging out', e);
                        }
                        request.cookieAuth && request.cookieAuth.clear();
                        reply.redirect('/');
                    });
                }
            }
        },
        {
            method: 'DELETE',
            path: '/sessions/{session}',
            config: {
                auth: {mode: 'required'},
                handler(request, reply){
                    invalidate(request.cookieAuth.token, ()=> {
                        request.cookieAuth.clear();
                        reply();
                    });

                }
            }
        }
    ].concat(
        options.providers.reduce((ret, {
            name,
            auth,
            loginPath,
            registerPath,
            redirectTo = '/accesskey'
        })=> {
            const strategy = auth || name;
            loginPath = loginPath || `/auth/login/${name}`;
            ret.push({
                method: 'GET',
                path: loginPath,
                config: {
                    auth: strategy,
                    handler ({auth:{isAuthenticated, credentials}, cookieAuth}, reply) {
                        if (!isAuthenticated) {
                            return reply('Not logged in...').code(401);
                        }
                        if (credentials && credentials.profile) {
                            const {email, displayName, username} = credentials.profile;
                            const {hostname} =credentials.query || {};
                            //(email, createdBy, friendlyName, ttl
                            addAccessKey(email, hostname, displayName || username, void(0), (e, token)=> {
                                if (e) {
                                    console.error('Error adding key', e);
                                    return reply(errorPage(e));
                                }
                                cookieAuth.set({token: token.name});
                                reply.redirect(redirectTo).code(302);
                            });
                        } else {
                            reply.redirect(redirectTo).code(302);
                        }
                    }
                }
            });
            if (registerPath !== false) {
                registerPath = registerPath || `/auth/register/${name}`;
                ret.push({
                    method: 'GET',
                    path: registerPath,
                    config: {
                        auth: strategy,
                        handler ({auth:{isAuthenticated, credentials}, cookieAuth}, reply) {
                            if (!isAuthenticated) {
                                console.error('request was not authenticated');
                                return reply('Not logged in...').code(401);
                            }
                            createToken(credentials, (e, token)=> {
                                if (e) {
                                    if (e.output && e.output.payload && e.output.payload.error === 'Conflict') {
                                        return reply(errorPage({message: 'This account is already registered, try logging in instead.'}, `/auth/login?hostname=${credentials.query && credentials.query.hostname}`))
                                    }
                                    console.error('Error creating token', e);
                                    return reply(errorPage({message: e.message}));
                                }
                                cookieAuth.set({token: token.name});
                                reply.redirect(redirectTo).code(302);
                            });

                        }
                    }
                });
            }
            return ret;

        }, [])));

});
module.exports = {register};
