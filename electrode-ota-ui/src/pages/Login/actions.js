import {asAsyncEvent} from '../../util/actionHelper';
export const REQUEST_AUTHENTICATION = 'REQUEST_AUTHENTICATION';
export const RECEIVE_AUTHENTICATION = 'RECEIVE_AUTHENTICATION';
export const AUTHORIZATION = 'AUTHORIZATION';
export const REMOVE_AUTHORIZATION = 'REMOVE_AUTHORIZATION';

export const logout = asAsyncEvent(REMOVE_AUTHORIZATION);

export const login = (host, token, remember)=> {
	return ({
		type: REQUEST_AUTHENTICATION,
		receiveType: RECEIVE_AUTHENTICATION,
		method: 'isAuthenticated',
		payload: {host, token, remember},
		authorization: {host, token, remember}
	});
};
