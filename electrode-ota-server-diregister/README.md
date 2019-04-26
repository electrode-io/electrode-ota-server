
electrode-ota-server-diregister
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.


## Install
```
$ npm install electrode-ota-server-diregister
```


## Usage

Modules are registered using `diregister`

```js
import diregister from "electrode-ota-server-diregister";

module.exports.register = diregister({
    name: 'myModule',
    version: '0.0.1',
    multiple: false,
    connections: true,
    dependencies: []
}, (options) => {
  ....
});
```   


Once registered, they can use used in the `dependencies` list.
```js
import diregister from "electrode-ota-server-diregister";

module.exports.register = diregister({
    name: 'usingModule',
    version: '0.0.1',
    multiple: false,
    connections: false,
    dependencies: ['myModule', 'electrode:auth', 'ota!validate']
}, (options, myModule, auth, validators) => {
  myModule.blah();
  ...
});
```
Notice how dependencies are passed into the method after `options`.
