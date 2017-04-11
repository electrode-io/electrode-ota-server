import React from 'react';
import BusyIndicatorLess from './BusyIndicator.less';

export default function BusyIndicator({isBusy = true, children, className = '', message = `Loading...`}) {

    return isBusy ?
        <div key='busy' className={`${className} ${BusyIndicatorLess.busy} `}>
            <span className={BusyIndicatorLess.message}><i
                className="fa fa-spinner fa-spin fa-2x fa-fw"/>{` ${message}`}</span>
        </div> :
        children ?
            <span key="not-busy" className={`${className} ${BusyIndicatorLess.notbusy}`}>{children}</span> : null;

}