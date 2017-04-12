import ldap from 'ldapjs';
/**
 * This should be refactored to use an adminDn, and a clientDn, but
 * then the admin password has to be stored securely.  This should
 * be called roughly once a month, so I will live with it.
 *
 * @param conf
 * @returns {Function}
 */
export default function (conf) {
    const wrapName = conf.defaultNS ? (name) => {
        if (name.indexOf('\\') > -1) {
            return name;
        }
        return `${conf.defaultNS}\\${name}`
    } : (name) => name;

    return function (user, password, callback) {
        const username = wrapName(user);
        user = user.split('\\').pop();
        const cobj = Object.assign({}, conf);
        const client = ldap.createClient(cobj);


        try {
            client.bind(username, password, handleBind)
        } catch (error) {
            console.log(error);
            unbind(client);
        }
        function unbind(client, cb) {
            client.unbind(function (error) {
                if (error) {
                    console.log(error.message);
                } else {
                    console.log('client disconnected');
                }
                cb && cb();
            });
        }

        function handleBind(error) {
            if (error) {
                console.log("login failed", error.message);
                return unbind(client, () => callback(null, false));
            }

            const sopts = {
                filter: `sAMAccountName=${user}`,
                scope: 'sub',
                attributes: ['objectGUID', "dn", "sn", "CN", "mail", "l", "ST", "O", "C", "UID", "memberOf"]
            };
            client.search(conf.defaultSearch, sopts, function (error, search) {
                let found;
                search.on('searchEntry', function (entry) {
                    if (entry.object) {
                        if (!found) {
                            found = entry.object;
                        } else {
                            console.error('multiple answers found for query');
                        }
                    }
                });

                search.on('error', function (error) {
                    console.error('error: ' + error.message);
                });

                search.on("end", function (result) {
                    if (found && found.mail) {
                        console.log(`login ${username}`);
                        unbind(client, function () {
                            callback(null, true, {
                                id: found.dn,
                                provider: 'ldap',
                                profile: {
                                    displayName: found.cn,
                                    username: found.dn,
                                    email: found.mail
                                }
                            });
                        });
                        return;
                    }
                    unbind(client, callback);

                });
            });

        }
    }
}
