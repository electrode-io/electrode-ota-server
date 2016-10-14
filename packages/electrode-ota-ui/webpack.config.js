"use strict";

var path = require('path'), join = path.join.bind(path, __dirname);
var cssStr = 'css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss';
var autoprefixer = require('autoprefixer');
var webpack = require('webpack');
var lifecycle = process.env['npm_lifecycle_event'];
var isPrepublish = lifecycle === 'prepublish';
var isKarma = process.env['NODE_ENV'] === 'test';
var isTestDist = lifecycle === 'test-dist';

var config = {
	devtool: (isPrepublish ? '#source-map' : "#inline-source-map"),
	quiet: false,
	devServer: {
		noInfo: true,
		hot: true,
		inline: true,
		contentBase: join('public'),
		publicPath: '/',
		port: 4000,
		historyApiFallback: true,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Authorization, Origin, Content-Type, Accept",
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Credentials': true
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
		extensions: ['', '.jsx', '.js'],
		alias: {
			'fbjs': join('node_modules/fbjs'),
			'react': join('node_modules/react'),
			'Subschema': join('node_modules/subschema/src/index.jsx'),
			'subschema-prop-types': join('node_modules/subschema-prop-types/src/index.js'),
			'electrode-ota-ui': join('src/export.js'),
			'superagent-proxy': join('sp.js')
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
				loader: 'babel',
				include: [
					join('src'),
					join('public'),
					/node_modules\/subschema.*/,
					isKarma ? join('test') : join('no_such_dir')
				]
			},
			{test: /\.(png|jpe?g|mpe?g[34]?|gif)$/, loader: 'url-loader?limit=100000'},
			{test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff"},
			{test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream"},
			{test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file"},
			{test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml"},
			{
				test: /\.json$/,
				loader: 'json'
			},
			{
				test: /\.css$/,
				loader: 'style!css!postcss'
			},
			{
				test: /\.lessp$/,

				loader: 'style!css!less'
			},
			{
				test: /\.less$/,

				loader: 'style!' + cssStr + '!less'
			}]

	},
	postcss: [autoprefixer({
		browsers: ["Android 2.3", "Android >= 4",
			"Chrome >= 20", "Firefox >= 24",
			"Explorer >= 8", "iOS >= 6", "Opera >= 12", "Safari >= 6"]
	})],
	externals: [
		'fs'
	],
	plugins: [
		new webpack.DefinePlugin({
			'process.env.HOT': !!process.env.HOT,
			'process.env.DEV': process.env.NODE_ENV === 'development'
		})
	]
};

module.exports = config;
