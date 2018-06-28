import React from 'react';
import {connect} from 'react-redux';
import Deployment from './Deployment';
import boundDispatched from '../../util/boundDispatched';
import {
	renameDeployment,
	clearDeploymentHistory,
	getDeployment,
	getDeploymentMetrics,
	getDeploymentHistory,
	patchRelease,
	promote,
	release,
	rollback,
	removeDeployment,
	selectDeploymentAction,
	selectDeploymentLabel
} from './actions';
import {DISMISS_ERROR, navigate} from '../Shell/actions';

const mapStoreToProps = (state, props)=> {
	const {
		authorization,
		selectedDeployment,
		selectedDeploymentHistory,
		selectedApp:{deployments},
		metrics
	} = state;
	const {params}  = props;
	const pkgs = selectedDeploymentHistory && selectedDeploymentHistory.items || [];
	return ({
		...params,
		isError: selectedDeployment.isError,
		isRefresh: selectedDeployment.isRefresh,
		error: selectedDeployment.error,
		isFetching: selectedDeployment.isFetching || selectedDeploymentHistory.isFetching,
		authorization,
		deployments,
		metrics,
		action: selectedDeployment.action,
		label: selectedDeployment.isRefresh ? null : selectedDeployment.label || (selectedDeployment.package && selectedDeployment.package.label || '') || pkgs[pkgs.length - 1] && pkgs[pkgs.length - 1].label,
		isStale: selectedDeployment.isStale || selectedDeploymentHistory.isStale,
		selectedDeployment: selectedDeployment.value,
		selectedDeploymentHistory: pkgs,
	});
};


const makeUrl = function (app, deployment, deployments = []) {
	const dep = deployment ? `/deployments/${deployment}` : (deployments && deployments.length) ? `/deployments/${deployments[0]}` : '';
	return `/app/${app}${dep}`;

};
const mapDispatchToProps = (dispatch, pps) => {
	const _dispatch = (fn, ownProps, ...args)=> {
		const {authorization:{host, token}, ...rest} =  ownProps;
		return dispatch(fn(host, token, Object.assign(rest, ...args)));
	};

	return {
		onGetDeployment(value){
			return _dispatch(getDeployment, this, value)
		},
		onRenameDeployment(newName){
			return _dispatch(renameDeployment, this, {newName}).then(()=>dispatch(navigate(makeUrl(this.name, newName))));
		},
		onRemoveDeployment(){
			return _dispatch(removeDeployment, this).then(({isError})=>!isError && dispatch(navigate(makeUrl(this.name, null, this.deployments.filter(dep=>dep != this.deployment)))));

		},
		onClearDeploymentHistory(){
			return _dispatch(clearDeploymentHistory, this);
		},
		onGetDeploymentMetrics(value){
			return _dispatch(getDeploymentMetrics, this, value);
		},
		onGetDeploymentHistory(value){
			return _dispatch(getDeploymentHistory, this, value);
		},

		onPromote(destinationDeploymentName, updateMetadata){
			// appName, sourceDeploymentName, destinationDeploymentName
			return _dispatch(promote, this, {destinationDeploymentName, updateMetadata});
		},
		onRelease(fileOrPath, targetBinaryVersion, updateMetadata){
			return _dispatch(release, this, {fileOrPath, targetBinaryVersion, updateMetadata});
		},
		onPatchRelease(label, updateMetadata){
			const current = this.selectedDeployment && this.selectedDeployment.package;
			if (updateMetadata.isDisabled == null) {
				updateMetadata.isDisabled = false;
			}
			if (updateMetadata.isMandatory == null) {
				updateMetadata.isMandatory = false;
			}
			if (updateMetadata.rollout > 100 || current && current.label === label && current.rollout == updateMetadata.rollout) {
				delete updateMetadata.rollout;
			}
			return _dispatch(patchRelease, this, {label, updateMetadata});
		},
		onRollback(targetRelease){

			return _dispatch(rollback, this, {targetRelease});
		},
		onClearError(){
			return dispatch({type: DISMISS_ERROR});
		},
		onSelectDeploymentAction(action){
			dispatch(selectDeploymentAction(action));
		},
		onSelectDeploymentLabel(label){
			dispatch(selectDeploymentLabel(label));
		}


	}
};

export default connect(mapStoreToProps, mapDispatchToProps, boundDispatched)(Deployment);
