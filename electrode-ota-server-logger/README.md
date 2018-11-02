# electrode-ota-server-logger

This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

## Development

To run tests, ensure you have `yarn` and `lerna` installed. Run bootstrap, then use yarn test.

```
$ npm install -g yarn
$ lerna bootstrap
$ yarn test
```

## Usage

In your OTA-Server config, add this plugin to the plugins list

```js
{
  plugins:{
    "electrode-ota-server-logger": {
      priority: 1,
      options: {
        level: "warn"
      }
    }
  }
}
```

- priority: Defines priority plugin is loaded. This should be 1 as other plugins depend on this plugin.
- level: The lowest level to log. Levels below this setting will be ignored/no-op. The valid values and priority are ["error", "warn", "info", "log", "debug", "trace"].
