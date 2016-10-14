"use strict";


import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';

export default class OTALink extends Component {

    static propTypes = {
        icon: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
        href: PropTypes.string,
        activeClassName: PropTypes.string,
        title: PropTypes.string,
        className: PropTypes.string,
        onClick: PropTypes.func
    };
    static defaultProps = {
        activeClassName: 'active'
    };

    renderIcon(icons) {
        if (!icons) {
            return null;
        }
        icons = Array.isArray(icons) ? icons : [icons];
        return icons.map(icon=><i key={`icon-${icon}`} className={`fa fa-${icon} fa-fw`}/>);
    }

    render() {
        const {title, href = '',  icon, children, component, ...props} = this.props;
        return <Link to={href.replace(/^#/, '')} {...props}>{this.renderIcon(icon)} {title}{children}</Link>;
    }
};