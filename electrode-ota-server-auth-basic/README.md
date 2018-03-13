electrode-ota-server-auth-basic
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

## Install
```
$ npm install electrode-ota-server-auth-basic --save
```

## Usage

Electrode OTA authentication is based on HapiJS authenication and BellJS.
See https://hapijs.com/tutorials/auth for HapiJS authentication.
https://github.com/hapijs/bell


You can define your authentication strategy with the electrode-ota-server-auth module.  In this example, we define a validateFunc within the options of the the basic auth.  Note you will need to convert your config json file to a js file.
```json
"plugins": {
   ...
   "electrode-ota-server-auth": {
      "options": {
         "strategy": {
            "basic": {
               "module": "electrode-ota-server-auth-basic",
               "scheme": "basic",
               "options": {
                  "realm": "My Realm",
                  "validateFunc": (request, username, password, callback) => {
                     err = null;
                     isValid = true;
                     provider = "basic-auth";
                     profile = { email, displayName, username };
                     credentials = { provider, profile };
                     callback(err, isValid, credentials);
                  }
               }
            }
         }
      }
   }
```
Note the credentials matches what BellJS returns.


Another method to do the same thing is by overriding electrode-ota-server-validate.
Copy electrode-ota-server-validate to a new file "my-custom-auth-validate.js", add another validation method.
In this example, we added the `ldap` validation function.
```json
const register = diregister.default({
    name: 'ota!validate',
    dependencies: ['ota!account'],
    multiple: false,
    connections: false
}, (options, {validateFunc}) => {

    const token = (name, callback) => validateFunc(name).then(profile => callback(null, true, {
        email: profile.email,
        name
    }), () => callback(null, false));

    // validates existing session
    const session = (request, session, callback) => token(session.token, callback);


    return {
        // name matches "validate" field in "electrode-ota-server-auth" config
        ldap(r, username, password, callback){
            // TODO:
            //      validate username, password
           // credentials objects matches hapijs/bell credentials format.
           // {
           //          provider: 'custom',
           //          query: {},
           //          profile: {
           //                         id: '1234567890',
           //                         username: 'steve',
           //                         displayName: 'steve',
           //                         email: 'steve@example.com'
            //         }
            //   }
            callback(error, isValid, credentials);
        },
        token,
        session
    };
});
module.exports = {register};
```

In the config, override electrode-ota-server-validate with your custom validate.  Provide options if desired.
```json
const root = path.join.bind(path, __dirname, "..");

module.exports = {
....
   "electrode-ota-server-auth-validate": {
        "module": root("lib/my-custom-auth-validate"),
        "options": {}
   }
...
}
```

Then, in the config, use this validate method.  Note the `ldap` name matches those defined in your my-custom-auth-validate.js.
```json
{
 
 "plugins":{
             ...
           "electrode-ota-server-auth": {
            "options": {
                "strategy": {
                    "github-oauth": {
                        "enable": false
                    },
                    
                    "basic": {
                        "module":"electrode-ota-server-auth-basic",
                        "scheme": "basic",
                        "validate": "ldap",
                        "options": {
                            "realm": "<YOUR_REALM>"
                        }
                    }
                }
            }
        },
    }
}
```

-------
After one of the above changes, you also need to update "electrode-ota-server-routes-auth" to point to your new authentication method.
```json
"electrode-ota-server-routes-auth": {
    "options": {
        "providers": [
            {
                "name": "basic",
                "auth": "basic",
                "label": "Basic Authentication",
                "icon": {
                    "src": "https://examples.com/myLogo.png",
                    "height": 50,
                    "width": 50
                }
            }
        ]
    }
},
```
Here, we add a "Basic Authentication" link to the homepage.  This link will authenticate using "basic" strategy defined above.
