import React from 'react';
import Form from '../../components/BusyErrorForm';

export const schema = {
    schema: {
        destinationDeploymentName: {
            type: 'PathSelect',
            options: 'deployments',
            help: 'The deployment to promote this release to.'
        },
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
    fieldsets: [
        {
            legend: 'Promote Deployment',
            fields: 'destinationDeploymentName'
        },
        {
            legend: 'Update Metadata',
            fields: 'appVersion,description,isDisabled,isMandatory,rollout',
            buttons: [{
                action: 'submit',
                primary: true,
                label: 'Promote'
            }, {
                action: 'cancel',
                label: 'Cancel'
            }]
        }]
};

export default (props)=><Form schema={schema} message="Saving" {...props}/>;
