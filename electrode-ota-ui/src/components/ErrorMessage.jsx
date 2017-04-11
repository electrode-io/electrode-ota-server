import React from 'react';

const X = (<span aria-hidden="true">&times;</span>);
const cancel = (fn, ...args)=>(e)=> {
    e && e.preventDefault();
    fn(...args);
};

export default ({
    isError,
    onDismiss,
    level = 'warning',
    error = {
        message: 'An error occurred'
    },
    className = ''
})=> !isError ? null :
    (<div className={`alert ${className} alert-${level} ${onDismiss ? 'alert-dismissible' : '' }`} role="alert">
        {onDismiss ? <button type="button" className="close" data-dismiss="alert" aria-label="Close"
                             onClick={cancel(onDismiss)}>{X}</button> : null }
        {error.message || error}
    </div>);