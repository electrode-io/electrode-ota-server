"use strict";
import init from '../src/export';
init({
	authorization: {
		hideHost: true,
		token: sessionStorage.token,
		host: sessionStorage.host
	}
}, 'container', void(0), '/');
