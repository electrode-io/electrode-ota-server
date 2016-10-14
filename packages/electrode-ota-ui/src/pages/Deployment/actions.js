import {
    asAsyncEvent,
    makeManageAction
} from '../../util/actionHelper';



export const ADD_DEPLOYMENT = 'ADD_DEPLOYMENT', ADDED_DEPLOYMENT = 'ADDED_DEPLOYMENT';
export const addDeployment = makeManageAction('addDeployment', ADD_DEPLOYMENT, ADDED_DEPLOYMENT, 'name', 'deployment');


export const REMOVE_DEPLOYMENT = 'REMOVE_DEPLOYMENT', REMOVED_DEPLOYMENT = 'REMOVED_DEPLOYMENT';
export const removeDeployment = makeManageAction('removeDeployment', REMOVE_DEPLOYMENT, REMOVED_DEPLOYMENT, 'name', 'deployment');

export const REQUEST_DEPLOYMENT = 'REQUEST_DEPLOYMENT', RECEIVE_DEPLOYMENT = 'RECEIVE_DEPLOYMENT';
export const getDeployment = makeManageAction('getDeployment', REQUEST_DEPLOYMENT, RECEIVE_DEPLOYMENT, 'name', 'deployment');

export const RENAME_DEPLOYMENT = 'RENAME_DEPLOYMENT', RENAMED_DEPLOYMENT = 'RENAMED_DEPLOYMENT';
export const renameDeployment = makeManageAction('renameDeployment', RENAME_DEPLOYMENT, RENAMED_DEPLOYMENT, 'name', 'deployment', 'newName');

export const CLEAR_DEPLOYMENT_HISTORY = 'CLEAR_DEPLOYMENT_HISTORY', CLEARED_DEPLOYMENT_HISTORY = 'CLEARED_DEPLOYMENT_HISTORY';
export const clearDeploymentHistory = makeManageAction('clearDeploymentHistory', CLEAR_DEPLOYMENT_HISTORY, CLEARED_DEPLOYMENT_HISTORY, 'name', 'deployment');

export const REQUEST_DEPLOYMENT_METRICS = 'REQUEST_DEPLOYMENT_METRICS', RECEIVE_DEPLOYMENT_METRICS = 'RECEIVE_DEPLOYMENT_METRICS';
export const getDeploymentMetrics = makeManageAction('getDeploymentMetrics', REQUEST_DEPLOYMENT_METRICS, RECEIVE_DEPLOYMENT_METRICS, 'name', 'deployment');

export const REQUEST_DEPLOYMENT_HISTORY = 'REQUEST_DEPLOYMENT_HISTORY', RECEIVE_DEPLOYMENT_HISTORY = 'RECEIVE_DEPLOYMENT_HISTORY';
export const getDeploymentHistory = makeManageAction('getDeploymentHistory', REQUEST_DEPLOYMENT_HISTORY, RECEIVE_DEPLOYMENT_HISTORY, 'name', 'deployment');

export const PATCH_RELEASE = 'PATCH_DEPLOYMENT_RELEASE', PATCHED_RELEASE = 'PATCHED_DEPLOYMENT_RELEASE';
export const patchRelease = makeManageAction('patchRelease', PATCH_RELEASE, PATCHED_RELEASE, 'name', 'deployment', 'label', 'updateMetadata');

export const REQUEST_PROMOTE = 'PROMOTE_DEPLOYMENT_RELEASE', RECEIVE_PROMOTE = 'PROMOTED_DEPLOYMENT_RELEASE';
export const promote = makeManageAction('promote', REQUEST_PROMOTE, RECEIVE_PROMOTE, 'name', 'deployment', 'destinationDeploymentName', 'updateMetadata');

export const REQUEST_RELEASE = 'REQUEST_RELEASE', RECEIVE_RELEASE = 'RECEIVE_RELEASE';
export const release = makeManageAction('release', REQUEST_RELEASE, RECEIVE_RELEASE, 'name', 'deployment', 'fileOrPath', 'targetBinaryVersion', 'updateMetadata');

export const REQUEST_ROLLBACK = 'REQUEST_DEPLOYMENT_ROLLBACK', RECEIVE_ROLLBACK = 'RECEIVE_DEPLOYMENT_ROLLBACK';
export const rollback = makeManageAction('rollback', REQUEST_ROLLBACK, RECEIVE_ROLLBACK, 'name', 'deployment', 'targetRelease');

//UI State
export const SELECT_DEPLOYMENT_ACTION = 'SELECT_DEPLOYMENT_ACTION';
export const selectDeploymentAction = asAsyncEvent(SELECT_DEPLOYMENT_ACTION);
export const SELECT_DEPLOYMENT_LABEL = 'SELECT_DEPLOYMENT_LABEL';
export const selectDeploymentLabel = asAsyncEvent(SELECT_DEPLOYMENT_LABEL);

export default ({
    addDeployment,
    removeDeployment,
    getDeployment,
    renameDeployment,
    clearDeploymentHistory,
    getDeploymentMetrics,
    getDeploymentHistory,
    patchRelease,
    promote,
    release,
    rollback,
    selectDeploymentAction
});