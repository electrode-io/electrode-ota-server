import { replace } from "../../history";

export const DISMISS_ERROR = "DISMISS_ERROR";
export const NAVIGATE = "NAVIGATE";
export const NAVIGATED = "NAVIGATED";
export const RESET = "RESET";

//action tools
export const navigate = to => {
	return dispatch => {
		dispatch({
			type: NAVIGATE,
			to
		});
		return replace(to);
	};
};

// After login, reset the UI
export const loginReset = () => {
	return dispatch => [
		dispatch({
			type: RESET
		})
	];
};
