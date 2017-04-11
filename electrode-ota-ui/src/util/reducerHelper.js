export const generateReducer = (REQUEST, RECEIVE, key = 'value')=> {

    return (state = {}, {type, value, isError, error})=> {
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
                return {
                    isFetching: true
                };
            case RECEIVE:
                return {
                    [key]: value,
                    isFetching: false,
                };
            default:
                return state;
        }
    };
}

export default({generateReducer});