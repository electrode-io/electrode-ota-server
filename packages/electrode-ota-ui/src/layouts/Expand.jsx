"use strict";

import React, {Component, PropTypes, Children} from 'react';
import TransitionHeight from 'subschema/src/transition/ReactCSSReplaceTransition';
import Link from './Link';

const wrap$inner = (child)=> {
    if (child.type == 'li' || child.type === Expand) {
        return child;
    }
    return <li>{child}</li>
};

export const wrap = children =>Children.map(children, wrap$inner);

export default  class Expand extends Component {

    static propTypes = {
        icon: Link.propTypes.icon,
        title: Link.propTypes.title,
        //name allows grouping of properties.
        name: PropTypes.string
    };
    static defaultProps = {
        href: '#',
        preventDefault: true,
        onExpand(){
        },
        onDidExpand(){

        }
    };

    state = {open: this.props.open};

    componentWillReceiveProps({open}) {
        if (this.props.open != open) {
            this.toggle(open);
        }
    }

    componentWillUnmount() {
        if (Expand.Current === this) {
            Expand.Current = null;
        }
    }


    _toggle = (e) => {
     //   e && this.props.preventDefault && e.preventDefault();
        e && e.stopPropagation();
        this.props.onExpand(!this.state.open);
        this.toggle(!this.state.open)

    };


    toggle(open) {
        this.setState({open});
        if (open && Expand.Current != this) {
            if (!Expand.Current || Expand.Current.props.name === this.props.name) {
                Expand.Current && Expand.Current.toggle(false);
                Expand.Current = this;
            }
        }
        this.props.onDidExpand(open);
        return open;
    };


    renderChildren(children) {
        return <ul className="nav">{wrap(children)}</ul>;
    }

    render() {
        const {open} = this.state;
        const {title, href, children, icon} = this.props;
        return (<li className={open ? 'active' : ''}>
            <Link onClick={this._toggle} href={href} icon={icon}>{` ${title}`}<span className="fa arrow"></span></Link>
            <TransitionHeight transitionLeaveTimeout={300}
                              transitionEnterTimeout={300}
                              transitionHeightClass="height-transition"
                              transitionName={{
                                  enter: 'enter',
                                  enterActive: 'scollapsing',
                                  leave: 'leave',
                                  leaveActive: 'scollapsing',
                              }}>
                {open ? this.renderChildren(children) : null}
            </TransitionHeight>
        </li>);
    }
}
