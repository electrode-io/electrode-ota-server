import React from 'react';
import Form from '../../components/BusyErrorForm';
import Panel, {Heading, Footer, GroupItem, Body, Page} from '../../layouts/Panel';

const Add = {
	schema: {
		name: {
			title: 'Create An App',
			type: 'Text',
			help: 'Enter the name of your new app',
			validators: ['required', {type: 'max', max: 30}]
		}
	},
	fieldsets: {
		fields: 'name',
		buttons: [{action: 'submit', primary: true, label: 'Create'}]
	}
};

export default ({onCreate, addApp})=>(
	<Page><Form schema={Add} onSubmit={onCreate} {...addApp}/></Page>);
