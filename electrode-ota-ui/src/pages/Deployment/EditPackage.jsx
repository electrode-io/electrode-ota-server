import React from 'react';
import Form from '../../components/BusyErrorForm';


const schema = {
	schema: {
		appVersion: {
			type: 'Text',
			help: 'The application version the javascript is bound to, uses semver format'
		},
		description: {
			type: 'TextArea',

		},
		isDisabled: {
			type: 'Checkbox',
			help: 'Do not serve this up to clients'
		},
		isMandatory: {
			type: 'Checkbox',
			help: 'Force clients to update'
		},
		rollout: {
			type: 'Number',
			help: 'Rollout percentage, this can not be set to a lower value'
		}
	},
	fieldsets: {
		legend: 'Update metadata',
		fields: 'appVersion,description,isDisabled,isMandatory,rollout',
		buttons: [{
			action: 'submit',
			primary: true,
			label: 'Update'
		}, {
			action: 'cancel',
			label: 'Cancel'
		}]
	}
};

export default ({value, ...props})=> {
	if (value.isDisabled == null) {
		value.isDisabled = false;
	}
	if (value.isMandatory == null) {
		value.isMandatory = false;
	}
	return <Form schema={schema} value={value} {...props}/>;

}
