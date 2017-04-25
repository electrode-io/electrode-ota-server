import {
	REQUEST_AUTHENTICATION,
	RECEIVE_AUTHENTICATION,
	REMOVE_AUTHORIZATION,
} from './actions'


export const authorization = (state = {}, {type, isError, error, value, host, token, remember = false})=> {
	switch (type) {
		case REQUEST_AUTHENTICATION:
			sessionStorage.token = '';
			return {...state, isFetching: true};
		case RECEIVE_AUTHENTICATION:
			if (!value || error || isError) {
				return {
					host,
					hostname: state.hostname,
					hideHost: state.hideHost,
					remember,
					error:(error || !value && 'Invalid Token'),
					isError,
					isAuthenticated: false,
					isFetching: false
				};
			}
			return {
				isFetching: false,
				isLogout: false,
				isAuthenticated: value,
				hostname: state.hostname,
				host,
				token,
				remember
			};
		case REMOVE_AUTHORIZATION:
			return {
				isFetching: false,  isLogout: true, hostname: state.hostname,
				hideHost: state.hideHost
			};
		default:
			return state;
	}
};
export default({authorization});
