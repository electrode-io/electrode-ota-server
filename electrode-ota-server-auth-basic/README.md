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


You can define your authentication strategy with the electrode-ota-server-auth module.  In this example, we define a validateFunc within the options of the the basic auth.  Note you have to convert your config json file to a js file under `<root>/config/default.json`
```javascript
module.exports = {
"plugins": {
   "electrode-ota-server-auth": {
      "options": {
         "strategy": {
            "github-oauth": {
               "enable": false
            },
            "basic": {
               "module": "electrode-ota-server-auth-basic",
               "scheme": "basic",
               "options": {
                  "realm": "My Realm",
                  "validateFunc": (request, username, password, callback) => {
                     const err = null;
                     const isValid = true;
                     const provider = "basic-auth";
                     const profile = { email:"johndoe@example.com", displayName:"John Doe", username:"johndoe" };
                     const credentials = { provider, profile };
                     callback(err, isValid, credentials);
                  }
               }
            }
         }
      }
   }
   "electrode-ota-server-routes-auth": {
      options: {
        providers: [
          {
            name: "basic",
            auth: "basic",
            label: "Basic Authentication",
            icon: {
              src: "https://examples.com/myLogo.png",
              height: 50,
              width: 50
            }
          }
        ]
      }
    }
  }
};
```
- We disabled github-oauth (the default behavior)
- Then we define options for `electrode-ota-server-auth-basic`
- In the options, define your validateFunc.  Note the `credentials` matches what BellJS expects.
- Then we override the `electrode-ota-server-routes-auth` with our basic route.  Replace icon with your desired icon.  This adds the "Basic Authentication" link to the homepage.  This link will authenticate using "basic" strategy defined above.


Then restart the OTA server.
If you have an error complaining about github, make sure you have the `electrode-ota-server-routes-auth` defined, and you disable `github-oauth` as specified above.



Another method to do the same thing is by creating your own validation module; by overriding `electrode-ota-server-auth-validate`.
Create a new package.  Copy the contents of `electrode-ota-server-auth-validate` `package.json` and `index.js`.  Modify `index.js` to add your validation method.


In this example, we added the `basic` validation function.
```javascript
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
        basic(r, username, password, callback){
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

In the config, override electrode-ota-server-validate with your custom validate.  Provide options as desired.
```javascript
const root = path.join.bind(path, __dirname, "..");

module.exports = {

   "electrode-ota-server-auth-validate": {
        "module": root("lib/my-custom-auth-validate"),
        "options": {}
   }

}
```

Then, in the config, use this validate method.  Note the `basic` name matches those defined in your `my-custom-auth-validate`.
```json
{
 
 "plugins":{

           "electrode-ota-server-auth": {
            "options": {
                "strategy": {
                    "github-oauth": {
                        "enable": false
                    },
                    
                    "basic": {
                        "module":"electrode-ota-server-auth-basic",
                        "scheme": "basic",
                        "validate": "basic",
                        "options": {
                            "realm": "<YOUR_REALM>"
                        }
                    }
                }
            }
        },
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
    }
}
```

