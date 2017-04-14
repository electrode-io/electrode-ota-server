import {REFRESH_RELEASE, SELECT_RELEASE_DIR, PACKAGE_RELEASE, PACKAGED_RELEASE, NOTIFY_RELEASE} from './actions';
export const release = (state = {}, {type, value, message, isError})=> {

	switch (type) {
		case REFRESH_RELEASE: {
			return {};
		}
		case SELECT_RELEASE_DIR: {
			return {releaseDir: value};
		}
		case PACKAGE_RELEASE: {
			return {
				...state,
				isFetching: true,
				value
			}

		}
		case PACKAGED_RELEASE: {
			return {
				...state,
				...value,
				isFetching: false,
				isDone: true
			}
		}
		case NOTIFY_RELEASE: {
			return {
				...state,
				isError,
				messages: state.messages ? state.messages.concat(message) : [message]
			}
		}
	}

	return state;


};

export default ({release});
