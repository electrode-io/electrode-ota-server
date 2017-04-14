import {
    asAsyncEvent,
    asEvent,
    makeManageAction
} from '../../util/actionHelper';

export const REQUEST_ACCESS_KEYS = 'REQUEST_ACCESS_KEYS';
export const RECEIVE_ACCESS_KEYS = 'RECEIVE_ACCESS_KEYS';

export const REQUEST_ACCOUNT_INFO = 'REQUEST_ACCOUNT_INFO';
export const RECEIVE_ACCOUNT_INFO = 'RECEIVE_ACCOUNT_INFO';


export const REMOVE_ACCESS_KEY = 'REMOVE_ACCESS_KEY';
export const REMOVED_ACCESS_KEY = 'REMOVED_ACCESS_KEY';
export const CLEAR_ACCESS_KEY = 'CLEAR_ACCESS_KEY';
export const ADD_ACCESS_KEY = 'ADD_ACCESS_KEY';
export const ADDED_ACCESS_KEY = 'ADDED_ACCESS_KEY';
export const PATCH_ACCESS_KEY = 'PATCH_ACCESS_KEY';
export const PATCHED_ACCESS_KEY = 'PATCHED_ACCESS_KEY';

export const SELECT_EDIT_ACCESS_KEY = 'SELECT_EDIT_ACCESS_KEY';
export const DISMISS_ACCESS_KEY_ERROR = 'DISMISS_ACCESS_KEY_ERROR';

export const getAccessKeys = makeManageAction('getAccessKeys', REQUEST_ACCESS_KEYS, RECEIVE_ACCESS_KEYS);
export const getAccountInfo = makeManageAction('getAccountInfo', REQUEST_ACCOUNT_INFO, RECEIVE_ACCOUNT_INFO);
export const removeAccessKey = makeManageAction('removeAccessKey', REMOVE_ACCESS_KEY, REMOVED_ACCESS_KEY, 'name');
export const addAccessKey = makeManageAction('addAccessKey', ADD_ACCESS_KEY, ADDED_ACCESS_KEY, 'friendlyName', 'ttl');
export const clearAccessKey = asAsyncEvent(CLEAR_ACCESS_KEY);
export const dismissError = asAsyncEvent(DISMISS_ACCESS_KEY_ERROR);
export const selectEditAccessKey = (idx, value) => dispatch => Promise.resolve({
    type:SELECT_EDIT_ACCESS_KEY,
    idx,
    value
}).then(dispatch);
export const patchAccessKey = makeManageAction('patchAccessKey', PATCH_ACCESS_KEY, PATCHED_ACCESS_KEY, 'oldName', 'newName', 'ttl');
