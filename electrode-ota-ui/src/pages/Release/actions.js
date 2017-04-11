import {makeManageAction, asAsyncEvent} from '../../util/actionHelper';
import {makeArgs} from '../../util/cmd';
export const PACKAGE_RELEASE = 'PACKAGE_RELEASE';
export const PACKAGED_RELEASE = 'PACKAGED_RELEASE';
export const SELECT_RELEASE_DIR = 'SELECT_RELEASE_DIR';
export const NOTIFY_RELEASE = 'NOTIFY_RELEASE';
export const REFRESH_RELEASE = 'REFRESH_RELEASE';
export const selectReleaseDir = asAsyncEvent(SELECT_RELEASE_DIR);
export const refresh = asAsyncEvent(REFRESH_RELEASE, 'appName', 'deployment');
// export const makeManageAction = (method, type, receiveType, ...args)=>
export const releaseReact = (authorization, {framework = 'releaseReact', ...value}, releaseDir)=> dispatch=> Promise.resolve({
	type: PACKAGE_RELEASE,
	receiveType: PACKAGED_RELEASE,
	notifyType: NOTIFY_RELEASE,
	method: framework,
	exec: true,
	releaseDir,
	value: makeArgs(value),
	authorization
}).then(dispatch);

/**
 *
 *
 *
 *                         var releaseReactCommand = cmd;
 releaseReactCommand.appName = arg1;
 releaseReactCommand.platform = arg2;
 releaseReactCommand.appStoreVersion = argv["targetBinaryVersion"];
 releaseReactCommand.bundleName = argv["bundleName"];
 releaseReactCommand.deploymentName = argv["deploymentName"];
 releaseReactCommand.disabled = argv["disabled"];
 releaseReactCommand.description = argv["description"] ? backslash(argv["description"]) : "";
 releaseReactCommand.development = argv["development"];
 releaseReactCommand.entryFile = argv["entryFile"];
 releaseReactCommand.gradleFile = argv["gradleFile"];
 releaseReactCommand.mandatory = argv["mandatory"];
 releaseReactCommand.plistFile = argv["plistFile"];
 releaseReactCommand.plistFilePrefix = argv["plistFilePrefix"];
 releaseReactCommand.rollout = getRolloutValue(argv["rollout"]);
 releaseReactCommand.sourcemapOutput = argv["sourcemapOutput"];

 * @param dispatch
 */
