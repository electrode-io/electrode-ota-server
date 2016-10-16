Electrode OTA Server 
===

##Configuration
Electrode OTA Server is built on [electrode-server](https://github.com/electrode-io/electrode-server) along with the 
[electrode-confippet](https://github.com/electrode-io/electrode-confippet). So it follows the conventions used with
those systems.

### Environmental Variables
There are a few environmental variables that can be used to configure an instance.
 * NODE_ENV (production,development,...)
 * OTA_CONFIG_DIR (An additional dir besides ./config to look for configurations)
 * PORT - the http port to listen to.
 
### JSON/YAML/js
While the OTA Server can use yaml and javascript we will discuss the options
using the json syntax.  

## Options
Electrode OTA Server gets its configuration from electrode-ota-server/config/default.js  And the all the other configurations
are super imposed.   And some are missing.
