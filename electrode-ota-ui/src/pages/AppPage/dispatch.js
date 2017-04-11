import {
    getApp,
    renameApp,
    transferApp,
    removeApp,
} from './actions';
import {INVALIDATE_APPS} from '../AppsExpand/actions';
import {navigate} from '../Shell/actions';
import {addDeployment} from '../Deployment/actions';

export default (dispatch)=> {
    const _dispatch = (fn, ownProps, ...args)=> {
        const {authorization:{host, token}, name} =  ownProps;
        return dispatch(fn(host, token, Object.assign({name}, ...args)));
    };
    const invalidate = (resp)=> {
        if (!resp.isError) {
            dispatch({type: INVALIDATE_APPS});
        }
        return resp;
    };

    return {
        fetch({isFetching, isStale, params}){
            if (isFetching === true) {
                return
            }
            return _dispatch(getApp, this, params);
        },
        onAddDeployment(deployment){
            return _dispatch(addDeployment, this, {deployment}).then(({isError})=>!isError && dispatch(navigate(`/app/${this.name}/deployments/${deployment}`)));
        },

        onRenameApp(newName){
            const navTo = this.deployment ? `/app/${newName}/deployments/${this.deployment}` : `/app/${newName}`;
            return _dispatch(renameApp, this, {newName})
                .then(invalidate)
                .then(({isError})=> !isError && dispatch(navigate(navTo)));
        },
        onTransferApp(email){
            return _dispatch(transferApp, this, {email}).then(invalidate);
        },
        onRemoveApp(){
            return _dispatch(removeApp, this)
                .then(invalidate)
                .then(({isError})=> !isError && dispatch(navigate('/app')))
        }
    }

}
