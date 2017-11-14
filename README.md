Electrode OTA Server
===
The Electrode OTA Server provides a server to allow hot deploy to android and ios React Native&#8482;  and Cordova&#8482;  apps.   The server
is API compatible with [code-push-cli](https://microsoft.github.io/code-push/docs/cli.html), the
[Code Push React Native SDK](https://microsoft.github.io/code-push/docs/react-native.html) and the [Code Push Cordova SDK](https://microsoft.github.io/code-push/docs/cordova.html).


## Upgrade
Version 2 adds partial update support.  To do this it requires some alterations to the cassandra database.  This
will happen automatically, unless the configuration to the electrode-ota-dao-cassandra is configured as
```json

 "electrode-ota-server-dao-cassandra": {
                "options": {
                    ...
                    "disableTTYConfirmation": false,
                    //this is alter by default.
                    "migration": "safe",
                }
            }
 }

```
Make sure to backup your data, while not known to cause data loss, it is possible.


![OTA: Overview](./docs/img/OV1.png)

##Installation
For configuration instructions visit the [electrode.io](http://www.electrode.io/docs/electrode_react_native_over_the_air_electron.html)


```
 npm i electrode-ota-server
```

## Upload Size
To increase the max upload size, add this to your configuration:
```json

"electrode-ota-server-routes-apps" : {
            options : {
                payload : {
                    maxBytes : 94371840
                }                
            }
        }

```


Apache-2.0 © WalmartLabs
<br>
Built with :heart: by [Team Electrode](https://github.com/orgs/electrode-io/people) @WalmartLabs.
