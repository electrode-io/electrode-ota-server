import { makeManageAction } from '../../util/actionHelper';

export const REQUEST_SESSIONS = 'REQUEST_SESSIONS', RECEIVE_SESSIONS = 'RECEIVE_SESSIONS';
export const getSessions = makeManageAction('getSessions', REQUEST_SESSIONS, RECEIVE_SESSIONS);

export const REMOVE_SESSION = 'REMOVE_SESSION', REMOVED_SESSION = 'REMOVED_SESSION';
export const removeSession = makeManageAction('removeSession', REMOVE_SESSION, REMOVED_SESSION, 'machineName');

