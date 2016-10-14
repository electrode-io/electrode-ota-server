import {browserHistory, hashHistory} from 'react-router';
export default !window || window.location.protocol === 'file:' ? hashHistory : browserHistory;
