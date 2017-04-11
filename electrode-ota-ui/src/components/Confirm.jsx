import React from 'react';
import Confirm from './Confirm.less';

export default ({
    message = `Are you sure you want to remove `,
    confirmBtn = 'Yes',
    cancelBtn = 'No',
    confirm,
    onConfirm,
    children,
    className=''
}) => {

    const handleConfirm = (e) => {
        e && e.preventDefault();
        onConfirm(confirm);
    };

    const handleCancel = (e) => {
        e && e.preventDefault();
        onConfirm();
    };

    return (<span className={`${className} ${Confirm.container} ${confirm ? Confirm.show : Confirm.hide}`}>
            <span className={Confirm.blockout} onClick={handleCancel}></span>
            <span className={Confirm.message}>{message} "{confirm}"?
                 <div className="btn-group btn-group-xs btn-confirm-group">
                     <button className="btn btn-default" onClick={handleConfirm}>
                     <i className="fa fa-icon-remove"/>{confirmBtn}</button>
                     <button className="btn btn-primary" onClick={handleCancel}>{cancelBtn}</button>
                </div>
            </span>
        {children}
    </span>);
};
