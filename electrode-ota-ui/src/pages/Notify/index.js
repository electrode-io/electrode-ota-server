import Notify from '../../components/Notify';
import {connect} from 'react-redux';
import {clearNotification} from './actions';
const EMPTY_OBJ = {};
//action, isError, error, onDismiss, name, className
const mapStateToProps = ({notification}, {className, parent, name})=> {
    return parent && notification.parent === parent ? {
        ...notification,
        name: name || notification.name,
        className,
        isError: notification.isError
    } : EMPTY_OBJ;
};

const mapDispatchToProps = (dispatch, props)=> ({
    onDismiss(){
        dispatch(clearNotification());
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Notify);
