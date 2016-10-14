import React, {Component} from 'react';
import Form from './ReleaseForm';
import {makeArgs as process} from '../../util/cmd';
import Details from '../../layouts/Details';
import File from '../../components/FilePath';
const dirname = (path)=> {
	path = path || '';
	const parts = path.split(/\/|\\/g);
	parts.pop();
	return parts.join('/')
};

export default class Release extends Component {
	state = {
		value: ''
	};

	handleSubmit = (e)=> {
		e && e.preventDefault();
		this.props.onSelectReleaseDir(dirname(this.state.value));
	};

	handleFileChange = (value)=> {
		const dirValue = dirname(value);
		this.props.onSelectReleaseDir(dirValue);
	};

	handleCancel = (e)=> {
		e && e.preventDefault();
		this.props.onSelectReleaseDir();
	};


	renderStartRelease() {
		return (<form onSubmit={this.handleSubmit}>
			<p>Select a project's directory</p>
			<div className="input-group">
				<File type="file" className="form-control" placeholder="Select Project Directory"
					  directory multiple
					  onChange={this.handleFileChange}
				/>
				<span className="input-group-btn">
	        <button className="btn btn-default" type="submit">Select</button>
    	  </span>

			</div>
		</form>);
	}

	renderNoExec() {
		return <div>
			<h4>Need to run in shell</h4>
			<div>
				<pre>{this.props.noExec}</pre>
			</div>
		</div>
	}

	renderMessages() {

		if (!(this.props.messages && this.props.messages.length)) {
			return null;
		}
		return <Details legend="All Messages">
			<ul className="messages">
				{this.props.messages.map((message, idx)=><li key={`li-${idx}`}>{message}</li>)}
			</ul>
		</Details>
	}

	renderDone() {
		return <div>
			<p>Completed Release</p>
			{this.props.noExec ? this.renderNoExec() : null}
			{this.renderMessages()}
			<button onClick={this.props.onRefresh} className="btn btn-primary">Continue</button>
		</div>
	}

	lastMessage() {
		const {messages = []} = this.props;
		return messages.length ? messages[messages.length - 1] : 'Preparing...';
	}

	render() {
		return <div className="panel-body">
			{this.props.isDone ? this.renderDone() : !this.props.releaseDir ? this.renderStartRelease() :
				[<Form key="form" {...this.props} message={this.lastMessage()}/>, this.renderMessages()]}
		</div>
	}
}
