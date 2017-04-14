
electrode-ota-server-manager
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

This package provides a managment [ui](https://github.com/electrode-io/electrode-ota-server/electrode-ota-ui) for an electrode-ota server.   


## Install
```
$ npm install electrode-ota-server-manager --save
```

## Usage
Add the following to your configuration to use the ota server manager
```json
{
 "plugins":{
   ...,
   "electrode-ota-server-manager": {
   }
}

```