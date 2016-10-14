const config = require('./webpack.config');
const path = require('path');
const join = path.join.bind(path, __dirname);
const resolve = Object.assign({}, config.resolve);
delete resolve.alias['superagent-proxy'];
resolve.alias['superagent'] = 'superagent/superagent';

module.exports = Object.assign({}, config, {
	target: 'electron',
	devtool: 'sourcemap',
	devServer: Object.assign({}, config.devServer, {port: process.env.ELECTRON_HOT || 4002}),
	node: {
		__dirname: false,
		__filename: false
	},
	entry: {
		electron: process.env.ELECTRODE_ENTRY ? process.env.ELECTRODE_ENTRY : join('src', 'export')
	},
	resolve,
	output: {
		path: join('dist'),
		pathinfo: !!process.env.HOT,
		filename: 'electron.js',
		publicPath: '/',
		library: 'electrode-ota-ui',
		libraryTarget: 'commonjs2'
	},

	externals: ['electron', 'code-push', 'code-push-cli', 'superagent', 'superagent-proxy', 'fs']
});
