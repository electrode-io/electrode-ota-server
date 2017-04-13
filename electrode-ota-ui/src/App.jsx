"use strict";
import React from 'react';
import {Provider} from 'react-redux';
import Routes from './routes';

export default function App(props) {
	return (<Provider {...props}><Routes {...props}/></Provider>);
}
