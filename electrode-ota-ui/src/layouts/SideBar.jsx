"use strict";
import React, {Component, PropTypes, Children} from 'react';
import TransitionHeight from 'subschema/src/transition/ReactCSSReplaceTransition';
import SideBarStyle from './SideBar.less';
import {listen} from 'fbjs/lib/EventListener';
import Expand from './Expand';

const wrap$inner = (child)=> {
    if (child.type == 'li' || child.type === Expand || (child.type.WrappedComponent && child.type.WrappedComponent.name === "Expand")) {
        return child;
    }
    return <li>{child}</li>
};

const wrap = children=>Children.map(children, wrap$inner);

export default class SideBarContainer extends Component {
    static defaultProps = {
        onSearch(){
        },
        onSearchChange(){
        }
    };

    state = {
        must: (window.innerWidth > 756)
    };

    componentDidMount() {
        this._onResize = listen(window, 'resize', this.resizeHandler);
    }

    componentWillUnmount() {
        this._onResize && this._onResize.remove();
    }

    resizeHandler = (e)=> {
        this.setState({must: window.innerWidth > 756});
    };
    renderContent(show) {
        if (!this.state.must && !show) return null;
        return (<ul className="nav in" id="side-menu">
            <li>
                <div className="input-group custom-search-form">
                    <input type="text" className="form-control" placeholder="Search..."
                           onChange={this.props.onSearch}/>
                    <span className="input-group-btn">
                    <button className="btn btn-default" type="button" onClick={this.props.onSearch}><i
                        className="fa fa-search"/></button>
                </span>
                </div>
            </li>
            {wrap(this.props.children)}
        </ul>);
    }

    render() {
        const show = this.props.value != false;
        return (<div className="navbar-default sidebar" role="navigation">
            <TransitionHeight className={`sidebar-nav navbar-collapse  ${SideBarStyle.show}`}
                              transitionLeaveTimeout={300}
                              transitionEnterTimeout={300}
                              overflowHidden={true}
                              transitionName={{
                                  enter: 'enter',
                                  enterActive: 'scollapsing',
                                  leave: 'leave',
                                  leaveActive: 'scollapsing',
                              }}
                              aria-expanded={show}>
                {this.renderContent(show)}
            </TransitionHeight>
        </div>);
    }
}
