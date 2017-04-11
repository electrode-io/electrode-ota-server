import {combineReducers} from 'redux';
import * as collaborator from '../pages/Collaborator/reducers';
import * as profile from '../pages/Profile/reducers';
import * as deployment from '../pages/Deployment/reducers';
import * as selectedApp from '../pages/AppPage/reducers';
import * as sessions from '../pages/Session/reducers';
import * as apps from '../pages/AppsExpand/reducers';
import * as login from '../pages/Login/reducers';
import * as notify from '../pages/Notify/reducers';
import * as release from '../pages/Release/reducers';

export default combineReducers({
	...profile,
	...deployment,
	...collaborator,
	...selectedApp,
	...sessions,
	...apps,
	...login,
	...notify,
	...release
});
