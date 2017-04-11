var context = require.context('.', false, /\.js(x)?$/), api = {}; //make sure you have your directory and regex test set correctly!
context.keys().forEach(function (key) {
    var k = key.replace(/^\.\/(.*)\.js(x)?$/, '$1');
    api[k] = context(key).default;
});
module.exports = api;