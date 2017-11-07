
electrode-ota-server-routes-auth
===
This project is part of the [electrode-ota-server](https://github.com/electrode-io/electrode-ota-server)

It is not meant to be used standalone, use at your own risk.

## Install
```
$ npm install electrode-ota-server-routes-auth
```

## Usage

Defines the links to supported authentication methods on the landing page.

Example:
```
"electrode-ota-server-routes-auth": {
  "options": {
    "providers": [
      {
        "name": "Basic Auth",
        "auth": "basic",
        "label": "Walmart Basic Auth",
        "icon": {
          "src": "data:image/svg+xml;....",
          "height": 30,
          "width": 100
        }
      }
    ]
  }
}
```
- name : Name used in the /auth/*/{name} route and className
- auth: Strategy to use
- label: Label for button
- icon: Icon config for button.
