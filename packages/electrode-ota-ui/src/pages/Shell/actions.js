import history from '../../history';

export const DISMISS_ERROR = 'DISMISS_ERROR';
export const NAVIGATE = 'NAVIGATE';
export const NAVIGATED = 'NAVIGATED';


//action tools
export const navigate = (to)=> {

    return (dispatch)=> {
        dispatch({
            type: NAVIGATE,
            to
        });
        return history.replace(to);
    }

};
