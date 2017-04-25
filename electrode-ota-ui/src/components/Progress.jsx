"use strict";
import React, {Component, PropTypes} from 'react';


export default class Progress extends Component {

    static propTypes = {
        label: PropTypes.string,
        value: PropTypes.number,
        active: PropTypes.bool,
        striped: PropTypes.bool,
        min: PropTypes.number,
        max: PropTypes.number,
        level: PropTypes.oneOf(['success', 'warning', 'info', 'danger'])
    };

    static defaultProps = {
        striped: true,
        active: true,
        min: 0,
        max: 100,
        label: '',
        level: 'success'
    };

    render() {
        const {label, active, level, striped = true, value, min, max} = this.props;
        return (<div>
            <p>
                <strong>{label}</strong>
                <span className="pull-right text-muted">{value}% Complete</span>
            </p>
            <div className={`progress ${striped ? 'progress-striped' : ''} ${ active ? 'active' : ''}`}>
                <div className={`progress-bar progress-bar-${level}`} role="progressbar"
                     aria-valuenow={value}
                     aria-valuemin={min}
                     aria-valuemax={max}
                     style={{width: `${value}%`}}>
                    <span className="sr-only">(${value})% Complete (${level})</span>
                </div>
            </div>
        </div>);
    }
}