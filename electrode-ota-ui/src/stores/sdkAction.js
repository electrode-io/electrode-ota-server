import manage from "../util/manage";
import { replace } from "../history";

export default function sdkAction({ dispatch, getState }) {
	return next => action => {
		const {
			type,
			method,
			receiveType,
			payload = {},
			value,
			authorization,
			navigateTo,
			exec
		} = action;

		if (exec == true || !(method && receiveType)) {
			// Normal action: pass it on
			return next(action);
		}

		dispatch({
			type,
			value
		});

		const m = manage(
			authorization.host && authorization.host.replace(/\/+?$/, ""),
			authorization.token
		);

		const resp = m[method].apply(m, value || []).then(
			resolve =>
				dispatch({
					...payload,
					request: value,
					value: resolve,
					type: receiveType
				}),
			reject =>
				dispatch({
					...payload,
					error: reject || { message: "An Error Occurred" },
					isError: true,
					request: value,
					type: receiveType
				})
		);
		if (navigateTo) {
			resp.then(resp => {
				if (!(resp && resp.isError)) replace(navigateTo);
				return resp;
			});
		}
		return resp;
	};
}
