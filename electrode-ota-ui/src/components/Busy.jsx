import  React, {Component} from 'react';
import busy from './Busy.less';

export default function (props) {
    return <span className={`${props.busy ? busy.busy : ''} ${busy.container}`}><i className={busy.spinner}/></span>
}