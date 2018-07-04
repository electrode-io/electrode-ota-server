import { RECEIVE_APP, TRANSFERED_APP, RENAMED_APP } from "./actions";
import {
	ADDED_COLLABORATOR,
	REMOVED_COLLABORATOR
} from "../Collaborator/actions";
import {
	ADDED_DEPLOYMENT,
	RENAMED_DEPLOYMENT,
	REMOVED_DEPLOYMENT
} from "../Deployment/actions";
import { RESET } from "../Shell/actions";

export const selectedApp = (state = {}, { type, value, isError, error }) => {
	switch (type) {
		case RECEIVE_APP:
			if (isError) {
				return {
					...state,
					isFetching: false,
					error
				};
			}

			return { isStale: false, isError: false, isFetching: false, ...value };
		case ADDED_COLLABORATOR:
		case REMOVED_COLLABORATOR:
		case ADDED_DEPLOYMENT:
		case REMOVED_DEPLOYMENT:
		case RENAMED_DEPLOYMENT:
		case TRANSFERED_APP:
		case RENAMED_APP:
			if (isError) {
				return {
					...state,
					isFetching: false
				};
			}
			return {
				...state,
				isFetching: false,
				isError: false,
				isStale: Date.now()
			};
		case RESET:
			return {};
		default:
			return state;
	}
};
export default { selectedApp };
