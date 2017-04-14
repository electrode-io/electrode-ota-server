import React from 'react';
import _ErrorMessage from '../components/ErrorMessage';


export const ErrorMessage = _ErrorMessage;

export default ({children})=> (<div className="panel panel-default">{children}</div>);


export const Heading = ({label, children, labelClass="panel-title pull-left"})=> (<div className="panel-heading clearfix">
    <h3 className={labelClass}>{label || children}</h3>
    {label ? children : null}
</div>);

export const Footer = ({children})=>(<div className="panel-footer clearfix">{children}</div>);

export const GroupItem = ({children, label, className = 'list-group-item clearfix'})=> (<div className={className}>
    {label ? <p className="list-group-item-heading">{label}</p> : null }
    <div className="list-group-item-text">{children}</div>
</div>);

export const Body = ({children})=> (<div className="list-group">{children}</div>);

export const Page = ({label, children, ...rest})=> (<div {...rest}>
    <h1 className="page-header">{label}</h1>
    {children}
</div>);
