import React from 'react';
import Metrics from './Metrics.less';

export const Options = {
    color: 'primary',
    href: '#',
    className:Metrics.container,
    itemClassName:Metrics.item
};

export const Metric = ({count = 0, label = Options.label, onClick = Options.onClick, icon = Options.icon, color = Options.color, href = Options.href, className=Options.itemClassName})=> {
    return (  <div className={`col-lg-3 col-md-6 ${className}`}>
        <div className={`panel panel-${color}`}>
            <div className="panel-heading">
                <div className="row">
                    <div className="col-xs-3">
                        <i className={`fa fa-${icon} fa-5x`}></i>
                    </div>
                    <div className="col-xs-9 text-right">
                        <div className="huge">{count}</div>
                        <div>{label}</div>
                    </div>
                </div>
            </div>
            { onClick ? <a onClick={onClick} href={href}>
                <div className="panel-footer">
                    <span className="pull-left">View Details</span>
                    <span className="pull-right"><i className="fa fa-arrow-circle-right"></i></span>
                    <div className="clearfix"></div>
                </div>
            </a> : null }
        </div>
    </div>)
}

function renderMetrics({active = 0, downloaded = 0, failed = 0, installed = 0}) {
    return [<Metric key='active' count={active} label="Active" icon="comments" color="green"/>,
        <Metric key='installed' count={installed} label="Installed" icon="thumbs-o-up"/>,
        <Metric key='downloaded' count={downloaded} label="Downloaded" icon="cloud-download" color="yellow"/>,
        <Metric key='failed' count={failed} label="Failed" icon="meh-o" color="red"/>,
    ]
}
export default function ({metrics = {}, noMetrics = `No Metrics Yet`, className=Options.className}) {
    return <div className={`clearfix ${className}`}>
        {!metrics ? <h3>{noMetrics}</h3> : renderMetrics(metrics)}
    </div>
}