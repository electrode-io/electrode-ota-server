import {
    CONFIRM_COLLABORATOR,
    ADD_COLLABORATOR,
    ADDED_COLLABORATOR,
    REMOVE_COLLABORATOR,
    REMOVED_COLLABORATOR,
} from './actions';
import {RECEIVE_APP, REQUEST_APP} from '../AppPage/actions';


export const collaborator = (state = {}, {type, value, isError, error}) => {
    let completed;
    switch (type) {
        case CONFIRM_COLLABORATOR:
            const [appName, name] = value || [];
            return {
                isError: false,
                appName,
                name,
                confirm: true
            };
        case REMOVE_COLLABORATOR:
        case ADD_COLLABORATOR: {
            const [appName, name] = value || [];
            return {
                name,
                appName,
                isFetching: true
            }
        }
        case REMOVED_COLLABORATOR:
            completed = 'removed';
        case ADDED_COLLABORATOR: {
            completed = completed || 'added';
            const [appName, name] = value || [];
            if (isError) {
                return {
                    isFetching: false,
                    name,
                    appName,
                    isError,
                    error
                }

            }
            return {...state, confirm: false, completed};
        }
        case REQUEST_APP: {
            //Clear the completed state when navigating between components.
            if (state.appName != value) {
                return {
                    ...state,
                    completed: null
                }
            }
        }
        //will refresh the whole app, this should stop the timer.
        case RECEIVE_APP: {
            return {...state, isFetching: false}
        }
        default:
            return state;
    }
};

export default ({collaborator});