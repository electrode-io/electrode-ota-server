import { RENAMED_DEPLOYMENT, REMOVED_DEPLOYMENT } from "../Deployment/actions";
import { RESET } from "../Shell/actions";

import {
	ADDED_APP,
	REMOVED_APP,
	RENAMED_APP,
	TRANSFERED_APP
} from "../AppPage/actions";

import {
	INVALIDATE_APPS,
	RECEIVE_APPS,
	REQUEST_APPS,
	FILTER,
	TOGGLE_SIDEBAR
} from "./actions";

export const apps = (
	state = { items: [] },
	{ type, value, isError, error }
) => {
	switch (type) {
		case REQUEST_APPS:
			return {
				...state,
				items: state.items || [],
				isFetching: true
			};

		case RECEIVE_APPS:
			if (isError) {
				return { ...state, isError, error, isFetching: false };
			}
			return {
				...state,
				items: value,
				isStale: false,
				isFetching: false
			};
		case INVALIDATE_APPS: {
			return {
				...state,
				isStale: Date.now()
			};
		}
		case TOGGLE_SIDEBAR:
			if (value) {
				return {
					...state,
					isStale: Date.now()
				};
			}
		case TRANSFERED_APP:
		case REMOVED_APP:
		case ADDED_APP:
		case RENAMED_APP:
		case RENAMED_DEPLOYMENT:
		case REMOVED_DEPLOYMENT: {
			return {
				...state,
				isStale: Date.now()
			};
		}
		default:
			return state;
	}
};

export const sidebar = (state = false, { type, value }) => {
	switch (type) {
		case FILTER:
			return !value ? state : true;
		case TOGGLE_SIDEBAR:
			return value == null ? !state : value;
		case RESET:
			return false;
		default:
			return state;
	}
};

export const filter = (state = "", { type, value }) => {
	switch (type) {
		case FILTER:
			return value;
		default:
			return state;
	}
};

export default {
	filter,
	sidebar,
	apps
};
