# Sample App

## Prerequisite

- [Docker](https://docs.docker.com/install/)

## To run this example

1. Update clientId, clientSecret github settings in `config/development.json`.  
```json
    "electrode-ota-server-auth": {
      "options": {
        "strategy": {
          "github-oauth": {
            "options": {
              "isSecure": false,
              "location":"http://localhost:9001",
              "password": "<some_random_32_char_cookie_password>",
              "clientId": "<clientId>",
              "clientSecret": "<clientSecret>"
            }
          },
```
`password` can be any random 32 characters.  `clientId` and `clientSecret` come from [Github setup](https://docs.electrode.io/other/powerful-electrode-tools/react-native-and-over-the-air#setting-up-oauth)

2. Bring up cassandra and the server in two different terminals
```sh
$ docker-compose up cassandra-db
$ docker-compose up ota-demo
```

3. From the browser, go to `http://localhost:9001`.  Alternatively, use `code-push` to login.
```sh
$ code-push login http://localhost:9001
```

# Development

The examples uses the latest published electrode-ota-server. To use your local source, update the following line

```
  "electrode-ota-server": "../electrode-ota-server",
```

This points the electrode-ota-server to your local source.

Make sure you run `docker build` again.
