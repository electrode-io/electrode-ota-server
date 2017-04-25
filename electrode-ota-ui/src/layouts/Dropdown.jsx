"use strict";

import React, {Component, Children} from 'react';
import Link from './Link';
import {listen} from 'fbjs/lib/EventListener';
import {findDOMNode} from 'react-dom';

export const Divider = () => <li className="divider"/>;
export const More = (props)=> <li>
    <a className="text-center" href={props.href || '#'}>
        <strong>{props.label}{props.children}</strong>{` `}<i className="fa fa-angle-right"/>
    </a>
</li>;

const wrap$inner = (child)=> {
    if (child.type === 'li' || child.type === Divider || child.type === More) {
        return child;
    }
    return <li>{child}</li>;
};

const wrap = (children) => Children.map(children, wrap$inner);

export default  class Dropdown extends Component {

    static defaultProps = {
        onClick(){
        }
    };

    state = {
        count: this.props.count
    };

    componentDidMount() {
        this._onClick = listen(window.document, 'click', this.hide);
    }

    componentWillUnmount() {
        this._onClick && this._onClick.remove();
    }

    hide = (e) => {
        let parent = e.target;
        const ref = findDOMNode(this);
        while (parent && parent != ref) {
            parent = parent.parentNode;
        }
        if (!parent)
            this.setState({open: false});
    };

    handleClick = (e)=> {
        e && e.preventDefault();
        this.props.onClick(e);
        this.setState({open: !this.state.open, count: null});
    };

    renderBadge(count) {
        return count ? <span className="badge">{count}</span> : null;
    }

    render() {
        const {open, count} = this.state;
        const {type, children, onClick} = this.props;
        return (<li className={`dropdown ${open ? 'open' : ''}`} onClick={this.handleClick}>
            <Link component="button" className="dropdown-toggle" onClick={e=>e.preventDefault()} icon={[type]} href="#">
                {this.renderBadge(count)}
                <i className="fa fa-fw fa-caret-down"/>
            </Link>
            {open ?
                <ul className={`dropdown-menu dropdown-${type}`}
                    style={{display: 'block'}}>{wrap(children)}</ul> : null}

        </li>);
    }
}