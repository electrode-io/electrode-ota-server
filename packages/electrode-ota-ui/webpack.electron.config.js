const config = require('./webpack.config');
const path = require('path');
const join = path.join.bind(path, __dirname);
const resolve = Object.assign({}, config.resolve);

//since the target is electron and electron can do superagent, but it uses the top level.
//we alias it to the browser one.
//superagent alias so it doesn't use the "main" windows. so we can debug.
resolve.alias['superagent'] = join('node_modules', 'superagent', 'lib', 'client');
resolve.alias["reduce"] = "reduce-component";
resolve.alias["emitter"] = "component-emitter";

module.exports = Object.assign({}, config, {
	target: 'electron',
	devtool: 'sourcemap',
	devServer: Object.assign({}, config.devServer, {port: process.env.ELECTRON_HOT || 4002}),
	node: {
		__dirname: false,
		__filename: false
	},
	entry: {
		electron: join('src', 'export')
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

	externals: ['electron', 'fs']
});
