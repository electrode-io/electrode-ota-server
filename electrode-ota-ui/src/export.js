import React from 'react';
import {render} from 'react-dom';
import App from './App';
import createStore from './stores/createStore';
import manage from './util/manage';
import fakeExecute from './fakeExec';

const _data = {
	authorization: {}
};

export default (data = _data, container = 'container', executor = fakeExecute, basepath) => new Promise((resolve, reject) => {
	const {token, host} = data.authorization || {};
	const app = ({isAuthenticated = false, isError = false, error}) => {
		//if its an error we'll ignore it.
		data.authorization = {token, host, isAuthenticated, isError, error};

		const element = document.getElementById(container);

		return resolve(render(<App store={createStore(data, executor)} basepath={basepath}/>, element));
	};

	if (host && token) {
		return manage(host, token).isAuthenticated().then(isAuthenticated => {
			return app({
				isAuthenticated,
				isError: !isAuthenticated,
				error: !isAuthenticated && 'Invalid Credentials'
			});
		}, error => app({
			isError: true,
			error
		}));
	}
	return app({});
});

