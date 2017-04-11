import React from 'react'
import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import createLogger from 'redux-logger'
import reducer from './reducers'
import sdkAction from './sdkAction';
import execAction from './execAction';


export default (data = {}, executor)=> {
	const middleware = [thunk, sdkAction, execAction(executor)];

	if (process.env.NODE_ENV !== 'production') {
		middleware.push(createLogger())
	}

	const enhancer = window.devToolsExtension ? compose(
		// Middleware you want to use in development:
		applyMiddleware(...middleware),
		// Required! Enable Redux DevTools with the monitors you chose
		window.devToolsExtension()
	) : applyMiddleware(...middleware);


	return createStore(reducer, data, enhancer);
};

