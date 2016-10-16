import React, {Component} from 'react';
import {datetime as formatDate} from '../../util/fmt';

// Label │ Release Time           │ App Version │ Mandatory │ Description │ Install Metrics
export default function History({deployments = [], metrics, active, currentUserEmail, onSelect}) {
	if (deployments == null || deployments.length == 0) {
		return null;
	}
	const handleSelect = ({currentTarget:{dataset:{idx}}})=> onSelect(deployments[parseInt(idx, 10)].label);
	return (<table className="table  table-hover">
		<thead>
		<tr>
			<th>Label</th>
			<th>Release Time</th>
			<th>App Version</th>
			<th>Mandatory</th>
			<th>Description</th>
			<th>Install Metrics</th>
		</tr>
		</thead>
		<tbody>
		{deploymentList(deployments, metrics).map(deploymentListTr, {currentUserEmail, active, onSelect: handleSelect})}
		</tbody>
		<tfoot>

		</tfoot>
	</table>);
};

const deploymentListTr = function ({packageObject, metrics}, idx) {
	const {currentUserEmail, onSelect, active} = this;
	const releaseSource =
		(packageObject.releaseMethod === "Promote") ? `Promoted "${packageObject.originalLabel}" from "${packageObject.originalDeployment}"` :
			(packageObject.releaseMethod === "Rollback") ?
				`Rolled back v${parseInt(packageObject.label.substring(1)) - 1} to  ${packageObject.originalLabel}` : '';

	return <tr key={`row-${idx}`}
			   className={`${packageObject.disabled ? 'disabled-package' : ''} ${packageObject.label == active ? 'active' : ''}`}
			   data-idx={idx}
			   onClick={onSelect}>
		{
			[packageObject.label,
				<span
					className="magenta release"
					title={'' + packageObject.uploadTime}>{ formatDate(packageObject.uploadTime)}
					<div className="release-seouce">{releaseSource}</div>
				</span>,
				packageObject.appVersion,
				packageObject.isMandatory ? "Yes" : "No",
				packageObject.description,
				<PackageMetrics packageObject={packageObject} metrics={metrics}>
					{ packageObject.isDisabled ? <div className="green">Disabled: Yes</div> : null}
					{ packageObject.rollout && packageObject.rollout !== 100 ?
						<div className="green">Rollout: {packageObject.rollout.toLocaleString()}%</div> : null}
				</PackageMetrics>].map(mapCell)
		}

	</tr>
};
const makeActions = (cell, i)=> {
	return (<td>
		<div className="btn-group btn-group-xs">
			<button action="revert" data-idx="0" className="btn btn-default undefined "
					aria-label="Revert">Revert<i className="fa fa-fw fa-history"></i></button>
			<button action="release" data-idx="1" className="btn btn-default undefined "
					aria-label="Release">Release<i
				className="fa fa-fw fa-file-code-o"></i></button>
			<button action="edit" data-idx="2" className="btn btn-default undefined "
					aria-label="Patch">Patch<i className="fa fa-fw fa-pencil"></i></button>
			<button action="promote" data-idx="4" className="btn btn-default undefined "
					aria-label="Promote">Promote<i className="fa fa-fw fa-arrow-circle-up"></i></button>
		</div>
	</td>);
};

const mapCell = (cell, i)=><td key={`cell-${i}`}>{cell}</td>


function PackageMetrics({packageObject, metrics, children}) {
	if (!packageObject || !metrics) {
		return <span><div className="magenta">No installs recorded</div>
			{children}</span>
	}
	const activePercent = metrics.totalActive
		? metrics.active / metrics.totalActive * 100
		: 0.0;
	const percentString = (activePercent === 100.0) ? '100%' : (activePercent === 0.0) ? "0%" : activePercent.toPrecision(2) + "%";
	const numPending = metrics.downloaded - metrics.installed - metrics.failed;
	return <div>

		<div
			className="active green">{`Active: ${percentString} (${metrics.active.toLocaleString()} of ${metrics.totalActive.toLocaleString()})`}</div>
		<div className="total green">{`Total: ${metrics.installed.toLocaleString()}`}</div>
		{numPending > 0 ? <div className="pending green">{`(${numPending.toLocaleString()} pending)`}</div> : null}
		{metrics.failed ?
			<div className="rollbacks red">{`Rollbacks: ${metrics.failed.toLocaleString()}`}</div> : null }
		{children}
	</div>

}

const deploymentList = (deployments=[], metrics={})=> deployments.map(function (packageObject) {
	const totalActive = getTotalActiveFromDeploymentMetrics(metrics || {});
	const metric = metrics[packageObject.label] || {
			active: 0,
			installed: 0,
			failed: 0,
			downloaded: 0
		};
	return {

		packageObject,
		metrics: {
			...metric,
			totalActive
		}
	};
});

const getTotalActiveFromDeploymentMetrics = (metrics)=> {
	var totalActive = 0;
	Object.keys(metrics).forEach(label=> totalActive += metrics[label].active);
	return totalActive;
};
