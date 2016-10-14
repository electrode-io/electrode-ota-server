import {makeManageAction, asAsyncEvent} from '../../util/actionHelper';
export const INVALIDATE_APPS = 'INVALIDATE_APPS';
export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
export const toggle = asAsyncEvent(TOGGLE_SIDEBAR);

export const FILTER = 'FILTER';
export const filter = asAsyncEvent(FILTER);

export const REQUEST_APPS = 'REQUEST_APPS', RECEIVE_APPS = 'RECEIVE_APPS';

export const getApps = makeManageAction('getApps', REQUEST_APPS, RECEIVE_APPS);
