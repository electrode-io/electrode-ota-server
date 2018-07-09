import {
	REQUEST_DEPLOYMENT,
	RECEIVE_DEPLOYMENT,
	CLEAR_DEPLOYMENT_HISTORY,
	REQUEST_DEPLOYMENT_HISTORY,
	RECEIVE_DEPLOYMENT_HISTORY,
	REQUEST_DEPLOYMENT_METRICS,
	RECEIVE_DEPLOYMENT_METRICS,
	PATCH_RELEASE,
	PATCHED_RELEASE,
	REQUEST_PROMOTE,
	RECEIVE_PROMOTE,
	REQUEST_ROLLBACK,
	RECEIVE_ROLLBACK,
	SELECT_DEPLOYMENT_ACTION,
	SELECT_DEPLOYMENT_LABEL,
	ADDED_DEPLOYMENT,
	RENAMED_DEPLOYMENT,
	REMOVED_DEPLOYMENT
} from "./actions";
import { REFRESH_RELEASE } from "../Release/actions";
import { DISMISS_ERROR, RESET } from "../Shell/actions";
import { generateReducer } from "../../util/reducerHelper";

export const selectedDeployment = (
	state = {},
	{ type, value, isError, error }
) => {
	let isRefresh = false;
	switch (type) {
		case DISMISS_ERROR:
			return { ...state, isError: false, error: void 0 };

		case SELECT_DEPLOYMENT_ACTION:
			return {
				...state,
				action: value
			};

		case SELECT_DEPLOYMENT_LABEL:
			return {
				...state,
				label: value
			};
		case ADDED_DEPLOYMENT: {
			if (isError) {
				return {
					...state,
					isError,
					error
				};
			}
		}

		case REQUEST_PROMOTE:
		case REQUEST_ROLLBACK:
		case PATCH_RELEASE:
		case REQUEST_DEPLOYMENT:
			return {
				...state,
				isFetching: true
			};
		case REMOVED_DEPLOYMENT:
		case RENAMED_DEPLOYMENT:
		case RECEIVE_ROLLBACK:
		case RECEIVE_PROMOTE:
		case CLEAR_DEPLOYMENT_HISTORY:
		case REFRESH_RELEASE:
			return {
				...state,
				isRefresh: true
			};

		case PATCHED_RELEASE: {
			if (isError) {
				return {
					...state,
					isError,
					isStale: false,
					isFetching: false,
					error
				};
			}
			return {
				isStale: Date.now(),
				isRefresh,
				isFetching: true
			};
		}
		case RECEIVE_DEPLOYMENT: {
			if (isError) {
				return {
					...state,
					isError,
					isStale: false,
					isFetching: false,
					error
				};
			}
			return {
				value,
				isStale: false,
				isFetching: false
			};
		}
		case RESET:
			return {};

		default:
			return state;
	}
};
export const selectedDeploymentHistory = generateReducer(
	REQUEST_DEPLOYMENT_HISTORY,
	RECEIVE_DEPLOYMENT_HISTORY,
	"items"
);
export const metrics = generateReducer(
	REQUEST_DEPLOYMENT_METRICS,
	RECEIVE_DEPLOYMENT_METRICS
);
export default {
	selectedDeployment,
	selectedDeploymentHistory,
	metrics
};
