import {generateReducer} from '../../util/reducerHelper';
import {
    REQUEST_ACCESS_KEYS,
    RECEIVE_ACCESS_KEYS,
    ADD_ACCESS_KEY,
    ADDED_ACCESS_KEY,
    PATCH_ACCESS_KEY,
    PATCHED_ACCESS_KEY,
    REMOVE_ACCESS_KEY,
    REMOVED_ACCESS_KEY,

    REQUEST_ACCOUNT_INFO,
    RECEIVE_ACCOUNT_INFO,

    CLEAR_ACCESS_KEY,

    DISMISS_ACCESS_KEY_ERROR,
    SELECT_EDIT_ACCESS_KEY
} from './actions';

const isFetching = {isFetching: true};
const isNotFetching = {isFetching: false};

export const accessKeys = (state = {items: [], isStale: Date.now()}, {type, value, error, isError}) => {
    switch (type) {

        case REQUEST_ACCESS_KEYS: {
            return {...state, ...isFetching};
        }
        case RECEIVE_ACCESS_KEYS: {
            return {items: value || [], isError, error, ...isNotFetching};
        }
        case PATCHED_ACCESS_KEY:
        case ADDED_ACCESS_KEY:
        case REMOVED_ACCESS_KEY:
            if (isError) {
                return {...state, isFetching: false, isStale: false, isError, error};
            }
            return {
                ...state,
                isFetching: false,
                isStale: Date.now()
            };
        default:
            return state;
    }

};
export const accountInfo = generateReducer(REQUEST_ACCOUNT_INFO, RECEIVE_ACCOUNT_INFO);

export const editAccessKey = (state = {}, {type, value, error, isError, idx})=> {

    switch (type) {
        case SELECT_EDIT_ACCESS_KEY: {
            return value ? {
                idx,
                error,
                isError,
                value
            } : {};
        }
        case ADD_ACCESS_KEY:
        case PATCH_ACCESS_KEY: {
            return {
                ...state,
                ...isFetching
            }
        }
        case ADDED_ACCESS_KEY:
            if (!isError) {
                return {
                    ...isNotFetching,
                    value
                }
            }
        case PATCHED_ACCESS_KEY: {
            if (isError) {
                return {
                    ...isNotFetching,
                    idx,
                    isError,
                    error,
                    value
                }
            }
            return {isStale: Date.now(), ...isNotFetching};
        }
        case CLEAR_ACCESS_KEY:
            return isNotFetching;

        case DISMISS_ACCESS_KEY_ERROR: {
            return {
                ...state,
                isError: false,
                error: void(0)
            }
        }
        default:
            return state;
    }

};
export default ({
    accessKeys,
    editAccessKey,
    accountInfo
});