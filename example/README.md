# Sample App

To run the sample app

Update `config/developement.json` settings for cassandra and github.

```sh
$ npm install
$ npm start
```

# Development

The examples uses the latest published electrode-ota-server. To use your local source, update the following line

```
  "electrode-ota-server": "../electrode-ota-server",
```

This points the electrode-ota-server to your local source.

Be sure to remove `node_modules` and re-run `npm install`.
