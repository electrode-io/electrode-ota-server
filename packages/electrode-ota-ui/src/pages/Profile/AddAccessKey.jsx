import React, {Component} from 'react';
import Form from '../../components/BusyErrorForm';
import Copy from '../../components/Copy';
const AccessKeySchema = {
    schema: {
        friendlyName: {
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
        legend: 'Add a new Access Key',
        fields: 'friendlyName,ttl',
        buttons: [
            {
                primary: true,
                label: 'Add',
                action: 'submit'
            },
            {
                action: 'cancel',
                label: 'Cancel'
            }
        ]
    }
};
export default function AddAccessKey({onClearAccessKey, value, ...rest}) {

    if (value && value.key) {
        return (<div className="panel  text-center panel-yellow">
            <h2>Copy this key "{value.name}" someplace safe. It is not recoverable</h2>
            <div className="panel-body text-center">
				<code className="key">
                <Copy text={value.key}/>
				</code>
            </div>
            <div className="panel-footer clearfix">
                <button className='btn btn-primary pull-right' onClick={onClearAccessKey}>Clear</button>
            </div>
        </div>);
    }
    return <Form schema={AccessKeySchema} value={value} {...rest} />

}
