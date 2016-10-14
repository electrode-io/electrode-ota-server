import React, {Component} from 'react';
import BusyErrorForm from '../../components/BusyErrorForm';

const EditAccessKeySchema = {
    schema: {
        oldName: {
            type: 'Hidden'
        },
        newName: {
            type: 'Text',
            title: 'Friendly Name',
            help: 'A friendly name to remember the key by',
            validators: ['required', {type: 'max', max: 30}]
        },
        ttl: {
            type: 'Timeout',
            title: 'Time to Live',
            help: 'How long do you want this key to be valid 0 is forever.'
        }
    },
    fieldsets: {
        legend: 'Edit Access Key',
        fields: ['oldName', 'newName', 'ttl'],
        buttons: [
            {
                primary: true,
                label: 'Update',
                action: 'submit'
            },
            {
                action: 'cancel',
                label: 'Cancel'
            }
        ]
    }
};
export default (props) => <BusyErrorForm schema={EditAccessKeySchema} {...props}/>
