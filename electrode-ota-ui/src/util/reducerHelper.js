export const generateReducer = (REQUEST, RECEIVE, key = "value") => {
	let originalRequest;
	return (state = {}, { type, request, value, isError, error }) => {
		if (isError) {
			return {
				...state,
				isError,
				isFetching: false,
				error
			};
		}
		switch (type) {
			case REQUEST:
				originalRequest = value;
				return {
					isFetching: true
				};
			case RECEIVE:
				if (request !== originalRequest) {
					// ignore response from previous request(s)
					return state;
				}
				return {
					[key]: value,
					isFetching: false
				};
			default:
				return state;
		}
	};
};

export default { generateReducer };
