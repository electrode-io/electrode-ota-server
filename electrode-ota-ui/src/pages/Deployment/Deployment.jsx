import React, {Component} from 'react';
import Panel, {Heading, Body, Footer, Page, GroupItem} from '../../layouts/Panel';
import Inplace from '../../components/Inplace';
import Confirm from '../../components/Confirm';
import Busy from '../../components/BusyIndicator';
import Package from './Package';
import Notify from '../Notify';
import EditPackage from './EditPackage';
import PromotePackage from './PromotePackage';
import ToggleButtons from '../../components/ToggleButtons';
import Metrics from './Metrics';
import Release from '../Release';
import History from './History';

export default class Deployment extends Component {

	componentDidMount() {
		this.props.onGetDeployment();
		this.props.onGetDeploymentHistory();
		this.props.onGetDeploymentMetrics();
	}

	componentWillReceiveProps({name, deployment, label, isStale, isFetching}) {
		if (this.props.name != name || this.props.deployment != deployment || (isStale && isStale != this.props.isStale)) {
			const value = {name, deployment};
			this.props.onClearError();
			this.props.onGetDeployment(value);
			this.props.onGetDeploymentHistory(value);
			this.props.onGetDeploymentMetrics(value);
		}

	}

	componentWillUnmount() {
		this.props.onClearError();
	}

	handleRemoveClick = (e)=> {
		e && e.preventDefault();
		this.props.onSelectDeploymentAction('remove');
	};
	handleRemove = (deployment)=> {
		if (deployment) {
			this.props.onRemoveDeployment(deployment);
		}
		this.props.onSelectDeploymentAction()
	};

	handleHistorySelect = ({target:{value}})=> {
		this.props.onSelectDeploymentLabel(value);
	};

	handleConfirmRevert = (revert)=> {
		if (revert) {
			this.props.onRollback(revert);
		}
		this.props.onSelectDeploymentAction();
	};
	handleConfirmClearHistory = (clearHistory)=> {
		if (clearHistory) {
			this.props.onClearDeploymentHistory();
		}
		this.props.onSelectDeploymentAction();
	};

	handleCancel = (e)=> {
		this.props.onSelectDeploymentAction();
	};

	handlePatchRelease = (updateMetadata)=> {
		this.props.onPatchRelease(this.props.label, updateMetadata).then(this.handleCancel);
	};

	handlePromote = ({destinationDeploymentName, ...updateMetadata})=> {
		this.props.onPromote(destinationDeploymentName, updateMetadata);
	};


	makeBtns() {
		if (this.props.selectedDeploymentHistory && this.props.selectedDeploymentHistory.length > 1) {
			return buttons;
		}
		if (!(this.props.selectedDeployment && this.props.selectedDeployment.package)) {
			return [buttons[1]];
		}
		return buttons.slice(1);

	}

	renderPromote(pkg) {
		const deployments = this.props.deployments.filter(isNotThis, this.props.deployment);
		return <PromotePackage value={{deployments, destinationDeploymentName: deployments[0], ...pkg}}
							   onSubmit={this.handlePromote}
							   onCancel={this.handleCancel}/>
	}

	renderActions() {
		const btns = this.makeBtns();

		return <ToggleButtons
				className={'btn-group-xs btn-group btn-top-right'}
				buttons={this.makeBtns()}
				active={this.props.action}
				onClick={this.props.onSelectDeploymentAction}/>


	}

	metrics({value}, label) {
		if (!value) return value;
		const pkg = (this.props.selectedDeploymentHistory.find(isLabel, label) || {});
		return pkg && value && (value[pkg.label] || value[pkg.originalLabel]);
	}

	render() {
		let {selectedDeployment, metrics = {}, label, action, deployment, deployments = [], selectedDeploymentHistory = [], isFetching, name, key, error, isError} = this.props;
		selectedDeployment = selectedDeployment || {};
		const pkg = selectedDeploymentHistory.find(isLabel, label);
		const isCurrent = !pkg ? true : selectedDeployment.package && selectedDeployment.package.label === pkg.label;
		return (<Busy isBusy={isFetching}>
				<div className='relative-inner'>

					<Confirm confirm={action == 'remove' ? deployment : null}
							 message="Are you sure you want to remove this deployment"
							 onConfirm={this.handleRemove}>
                <span className="edit-delete-header">
                  <h2>Deployment <Inplace value={deployment}
										  onChange={this.props.onRenameDeployment}/></h2>


                    <button onClick={this.handleRemoveClick} className="btn btn-xs btn-danger btn-right pull-right"
							aria-label="Remove Deployment"><i
						className="fa fa-remove"/>
                    </button>
                </span>
					</Confirm>
					<Busy isBusy={metrics.isFetching}>
						<Metrics metrics={this.metrics(metrics, label)}/>
						<History active={label} metrics={metrics.value} deployments={selectedDeploymentHistory} onSelect={this.props.onSelectDeploymentLabel}/>
					</Busy>
					<Panel>

						<Confirm confirm={action == 'revert' ? label : false}
								 onConfirm={this.handleConfirmRevert}
								 message="Are you sure you want to revert to this package">
							<Heading label={isCurrent ? 'Current' : this.props.label}>
								{ this.renderActions(pkg)}
							</Heading>
						</Confirm>
						<Notify parent={`deployment-release-${name}-${deployment}`} name={this.props.label}/>
						{action === 'release' ?
							<Release appName={name} deployment={deployment}/>
							: action == 'clear' ? <Confirm confirm={deployment} onConfirm={this.handleConfirmClearHistory}
														   message="Are you sure you want to clear the history of "/> :
							action == 'edit' ? <EditPackage value={pkg} onCancel={this.handleCancel}
															onSubmit={this.handlePatchRelease}/> :
								action == 'promote' ? this.renderPromote(pkg) :
									<Package {...selectedDeployment} depKey={selectedDeployment.key} package={pkg}/>}
					</Panel>
				</div>
			</Busy>
		);
	}
}
const buttons = [

		{
			action: 'revert',
			icon: 'history',
			label: 'Revert'
		}, {
			action: 'release',
			icon: 'file-code-o',
			label: 'Release',
		},
		{
			action: 'edit',
			icon: 'pencil',
			label: 'Patch',

		}, {
			action: 'clear',
			icon: 'trash-o',
			label: 'Clear History'
		}, {
			action: 'promote',
			icon: 'arrow-circle-up',
			label: 'Promote'
		}]
	;
const isNotThis = function (v) {
	return v != this
};
const isLabel = function ({label}) {
	return label == this;
};
