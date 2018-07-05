export default executor => ({ dispatch, getState }) => next => action => {
	const {
		type,
		method,
		receiveType,
		payload = {},
		value,
		releaseDir,
		authorization,
		notifyType,
		exec
	} = action;

	if (exec !== true) {
		// Normal action: pass it on
		return next(action);
	}

	dispatch({
		type,
		value
	});

	const resp = executor[method](authorization, releaseDir, value || [], {
		log(...args) {
			console.log(...args);
			dispatch({ type: notifyType, message: args.join(" ") });
		},
		error(...args) {
			console.error(...args);
			dispatch({ type: notifyType, isError: true, error: args.join(" ") });
		}
	}).then(
		responseValue =>
			dispatch({
				...payload,
				request: value,
				value: responseValue,
				type: receiveType
			}),
		error =>
			dispatch({
				...payload,
				error,
				isError: true,
				request: value,
				type: receiveType
			})
	);
	return resp;
};
