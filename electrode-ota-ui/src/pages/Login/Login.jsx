"use strict";
import React, {Component} from 'react';
import Form from '../../components/BusyErrorForm';

const schema = {
	schema: {
		token: {
			type: 'Password',
			help: 'Access token to use to login  (<a href="{host}/auth/login?hostname={hostname}" style="target-new: window;">New Token</a> or <a href="{host}/auth/register?hostname={hostname}" >register.</a>)'
		},
		host: {
			type: 'Text',
			help: 'Host to connect',
			conditional: {
				listen: 'hideHost',
				operator: 'truthy'
			}
		},
		remember: {
			type: 'Checkbox',
			title: 'Remember Me',
			template: 'CheckboxSpan'
		}
	},
	fieldsets: [
		{
			fields: ['token', 'host', 'remember'],
			buttons: {
				buttonsClass: 'btn-group-wide',
				buttons: [{
					action: 'submit',
					primary: true,
					className: 'btn btn-lg btn-success btn-block',
					label: 'Login'
				}]
			}
		}]
};


export default class Login extends Component {


	componentDidMount() {
		if (!this.props.isLogout)
			this.props.onSubmit(this.props.value);
	}

	render() {
		return <div className="container login">
			<div className="row">
				<div className="col-md-8 col-md-offset-2">
					<div className="login-panel panel panel-default">
						<div className="panel-heading">
							<h3 className="panel-title">Electrode Over the Air Login</h3>
						</div>
						<div className={`panel-body`}>
							<Form schema={schema} {...this.props}
								  message="Logging In..."/>
						</div>
					</div>
				</div>
			</div>
		</div>
	}
}
