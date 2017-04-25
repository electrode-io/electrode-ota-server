import React from 'react';
import Release from './Release';
import {connect} from 'react-redux';
import {releaseReact, selectReleaseDir, refresh} from './actions';
import bound from '../../util/boundDispatched';
import {getDeployment} from '../Deployment/actions'
const mapStateToProps = ({authorization, release:{releaseDir, isFetching, isDone, noExec, value,error, isError, messages}}, {appName, deployment})=> {
	return {
		authorization,
		appName,
		deployment,
		releaseDir,
		releaseInfo: value && value[0],
		isDone,
		isFetching,
		noExec,
		error,
		isError, messages
	}
};
const mapDispatchToProps = (dispatch, props)=> ({
	onSelectReleaseDir(value){
		dispatch(selectReleaseDir(value));
	},

	onSubmit(value)
	{
		const {authorization, deployment, appName, releaseDir} = this;
		value.deploymentName = deployment;
		value.appName = appName;
		dispatch(releaseReact(authorization, value, releaseDir));
	},
	onRefresh(){
		const {deployment, appName} = this;
		dispatch(refresh(appName, deployment));
	},
	onCancel(){
		dispatch(selectReleaseDir());
	}
});

export default connect(mapStateToProps, mapDispatchToProps, bound)(Release);
