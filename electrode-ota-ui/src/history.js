import {hashHistory, useRouterHistory} from 'react-router';
import {createHistory} from 'history';
let _history;

function ensureHistory() {
	if (!_history) {
		console.warn(`history has not been inited yet`);
		return false;
	}
	return true;
}



export function replace(...args) {
	if (ensureHistory())
		return _history.replace(...args);

}

export default function (basename) {
	console.log(`using ${basename}`);
	if (_history) {
		console.warn(`can not re-initialize history`);
		return _history;
	}
	return (_history = !window || window.location.protocol === 'file:' ? hashHistory : useRouterHistory(createHistory)({
		basename
	}));
}
