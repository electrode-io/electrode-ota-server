"use strict";

import React from 'react'
import {Router, Route, Redirect} from 'react-router';
import isAuthenticated from './auth';

import AppPage from './pages/AppPage';
import Profile from './pages/Profile';
import AddApp from './pages/AddApp';
import Shell from './pages/Shell';
import Login from './pages/Login';
import Session from './pages/Session';
import Deployment from './pages/Deployment';
import Components from './pages/Components';
import createHistory from './history';
export default function Routes({store, basepath}) {
	const history = createHistory(basepath);

	function handleEnter(nextState, replace) {
		if (!isAuthenticated(store)) {
			replace({
				pathname: '/login',
				state: {nextPathname: nextState.location.pathname}
			})
		}
	}

	return (<Router history={history}>
		<Redirect from="" to="/app"/>
		<Route path="/components" component={Components}/>
		<Route path="/login" component={Login}/>
		<Route path="/" component={Shell} onEnter={handleEnter}>
			<Route path="app" component={AddApp}/>
			<Route path="" component={AddApp}/>
			<Route path="app/:name" component={AppPage}>
				<Route path="deployments/:deployment" component={Deployment}/>
			</Route>
			<Route path="/profile" component={Profile}/>
			<Route path="/sessions" component={Session}/>

		</Route>
	</Router>);
}
