process.env.NODE_ENV = "development"
var otaServer = require('electrode-ota-server');
otaServer.default ? otaServer.default() : otaServer();
