"use strict";

var path = require('path'), join = path.join.bind(path, __dirname);
var cssStr = 'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader';
var autoprefixer = require('autoprefixer');
var webpack = require('webpack');
var lifecycle = process.env['npm_lifecycle_event'];
var isPrepublish = lifecycle === 'prepublish';
var isKarma = process.env['NODE_ENV'] === 'test';
var isTestDist = lifecycle === 'test-dist';
var isHot = process.argv.indexOf('--hot') > -1;
var config = {
	devtool: 'inline-source-map',//(isPrepublish ? '#source-map' : "#inline-source-map"),
	devServer: {
		noInfo: true,
		inline: true,
		contentBase: join('public'),
		publicPath: '/',
		port: 4000,
		historyApiFallback: true,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Authorization, Origin, Content-Type, Accept",
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Credentials': "true"
		},
		proxy: {
			'/cms/*': {
				"target": {
					"host": "codepush-management.azurewebsites.net",
					"protocol": 'https:',
					"port": 443
				},
				secure: false,
				changeOrigin: true,
				pathRewrite: {'^/cms': ''}

			}
		}
	},
	resolve: {
		extensions: ['.json', '.jsx', '.js'],
		alias: {
			'fbjs': join('node_modules/fbjs'),
			'react': join('node_modules/react'),
			'Subschema': join('node_modules/subschema/src/index.jsx'),
			'subschema-prop-types': join('node_modules/subschema-prop-types/src/index.js'),
			'electrode-ota-ui': join('src/export.js'),
			'superagent-proxy': join('sp.js'),
			'ValueManager': join('node_modules/subschema/src/ValueManager.js')
		}
	},
	stats: {
		colors: true,
		reasons: true
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				//   exclude: /node_modules/,
				//do this to prevent babel from translating everything.
				loaders: ['babel-loader?retainLines=true'],
				include: [
					join('src'),
					join('public'),
					/node_modules\/subschema.*/,
					isKarma ? join('test') : join('no_such_dir')
				]
			},
			{test: /\.(png|jpe?g|mpe?g[34]?|gif)$/, loader: 'url-loader?limit=100000'},
			{test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff"},
			{test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream"},
			{test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader"},
			{test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml"},
			{
				test: /\.json$/,
				loader: 'json-loader'
			},
			{
				test: /\.css$/,
				loader: 'style-loader!css-loader!postcss-loader'
			},
			{
				test: /\.lessp$/,

				loader: 'style-loader!css-loader!less-loader'
			},
			{
				test: /\.less$/,

				loader: 'style-loader!' + cssStr + '!less-loader'
			}]

	},
	externals: [
		//'fs'
	],
	plugins: [
		new webpack.DefinePlugin({
			'process.env.HOT': !!process.env.HOT,
			'process.env.DEV': process.env.NODE_ENV === 'development'
		}),
		new webpack.LoaderOptionsPlugin({
			options: {
				postcss: [autoprefixer({
					browsers: ["Android 2.3", "Android >= 4",
						"Chrome >= 20", "Firefox >= 24",
						"Explorer >= 8", "iOS >= 6", "Opera >= 12", "Safari >= 6"]
				})]
			}
		})
	]
};
if (isHot) {
	
	config.entry = [
		'react-hot-loader/patch',
		// activate HMR for React

		`webpack-dev-server/client?http://localhost:${config.devServer.port}`,
		// bundle the client for webpack-dev-server
		// and connect to the provided endpoint

		'webpack/hot/only-dev-server',
		// bundle the client for hot reloading
		// only- means to only hot reload for successful updates

		'./public/index.jsx',
		// the entry point of our app
	];
	/*	config.externals.length = 0;
	config.resolve.alias['fs'] = path.join(__dirname, 'src', 'fs-shim');
	config.resolve.alias['code-push'] = path.join(__dirname, 'src', 'fakeExec');
*/

}

module.exports = config;
