import React from 'react';
import Form from './Form';
import Busy from './BusyIndicator';
import Warning from './ErrorMessage';

export default function BusyErrorForm({isError=false, onDismiss, isFetching=false, error = 'An error occurred', message = 'Saving...', ...rest}) {
    return (<Busy isBusy={isFetching} message={message}>
        <Form {...rest}>
            <Warning isError={isError} error={error} onDismiss={onDismiss} className=" "/>
        </Form>
    </Busy>);
}