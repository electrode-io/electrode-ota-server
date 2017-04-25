import Profile from './Profile';
import {connect} from 'react-redux';
import boundDispatched from '../../util/boundDispatched';
import {
    dismissError,
    clearAccessKey,
    getAccountInfo,
    getAccessKeys,
    removeAccessKey,
    addAccessKey,
    patchAccessKey,
    selectEditAccessKey
} from './actions';

const mapDispatchToProps = (dispatch)=> {
    const _dispatch = (fn, ownProps, value, payload)=> {
        const {authorization:{host, token}} =  ownProps;
        return dispatch(fn(host, token, value, payload));
    };
    const onClearError = ()=>dispatch(dismissError());
    return {
        onAccountInfo(){
            return _dispatch(getAccountInfo, this);
        },
        onAccessKeys(){
            return _dispatch(getAccessKeys, this);
        },
        onRemoveAccessKey(name){
            return _dispatch(removeAccessKey, this, {name});
        },
        onAddAccessKey(value){
            return _dispatch(addAccessKey, this, value);
        },
        onPatchAccessKey(idx, value){
            return _dispatch(patchAccessKey, this, value, {idx});
        },
        onEditSelect(idx, value){
            return dispatch(selectEditAccessKey(idx, value));
        },
        onClearError,
        onClearAccessKey(){
            return dispatch(clearAccessKey());
        }
    }
};
const mapStateToProps = ({accountInfo, authorization, editAccessKey, accessKeys})=> {
    return ({
        isAdding: (editAccessKey && editAccessKey.idx == null && (editAccessKey.value  || editAccessKey.isError) ),
        editAccessKey,
        authorization,
        accountInfo,
        accessKeys,
        isStale: accessKeys.isStale,
        error: accountInfo.error || accessKeys.error,
        isError: accountInfo.isError || accessKeys.isError
    });
};
export default connect(mapStateToProps, mapDispatchToProps, boundDispatched)(Profile);
