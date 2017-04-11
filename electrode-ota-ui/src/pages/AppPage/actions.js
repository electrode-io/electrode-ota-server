import { makeManageAction } from '../../util/actionHelper';

export const REMOVE_APP = 'REMOVE_APP', REMOVED_APP = 'REMOVED_APP';
export const removeApp = makeManageAction('removeApp', REMOVE_APP, REMOVED_APP, 'name');

export const ADD_APP = 'ADD_APP', ADDED_APP = 'ADDED_APP';
export const addApp = makeManageAction('addApp', ADD_APP, ADDED_APP, 'name');

export const RENAME_APP = 'RENAME_APP', RENAMED_APP = 'RENAMED_APP';
export const renameApp = makeManageAction('renameApp', RENAME_APP, RENAMED_APP, 'name', 'newName');

export const TRANSFER_APP = 'TRANSFER_APP', TRANSFERED_APP = 'TRANSFERED_APP';
export const transferApp = makeManageAction('transferApp', TRANSFER_APP, TRANSFERED_APP, 'name', 'email');

export const REQUEST_APP = 'REQUEST_APP', RECEIVE_APP = 'RECEIVE_APP';
export const getApp = makeManageAction('getApp', REQUEST_APP, RECEIVE_APP, 'name');
