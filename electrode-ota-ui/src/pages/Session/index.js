import Session from './Session';
import {connect} from 'react-redux';
import boundDispatched from '../../util/boundDispatched';
import {
    removeSession,
    getSessions
} from './actions';

const mapDispatchToProps = (dispatch)=> {
    const _dispatch = (fn, ownProps, ...args)=> {
        const {authorization:{host, token}} =  ownProps;
        return dispatch(fn(host, token, Object.assign({}, ...args)));
    };
    return {
        onRemoveSession(machineName){
            return _dispatch(removeSession, this, {machineName}).then(_=>_dispatch(getSessions, this));
        },
        onGetSessions(){
            return _dispatch(getSessions, this);
        }
    }
};

export default connect(({sessions:{items, isFetching}, authorization})=>({
    sessions: items, isFetching, authorization
}), mapDispatchToProps, boundDispatched)(Session);
