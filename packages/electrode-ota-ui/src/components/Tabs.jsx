import React, {Component} from 'react';
import {Link, PropTypes} from 'react-router'
import Inplace from './Inplace';
import Tabless from './Tabs.less';

export const DefaultTabItem = ({label, ...rest}) =><Link {...rest}>{label}</Link>;
export default class Tabs extends Component {

    static contextTypes = {
        router: PropTypes.routerShape
    };

    static defaultProps = {
        tabItem: DefaultTabItem,
        tabs: [],
        canAdd: false,
        placeholder: '+ Add'
    };

    findActive(tabs) {
        for (var i = 0, l = tabs.length; i < l; i++) {
            if (this.context.router.isActive(tabs[i].to)) {
                return i;
            }
        }
        return 0;
    }

    renderTab(tab, idx) {
        const TabItem = this.props.tabItem;
        const isa = idx === this.active;
        return <li key={`tab-${idx}`} className={isa ? 'active' : ''}><TabItem {...tab} /></li>
    }

    render() {
        const {canAdd, tabs = [], placeholder, onAddTab}= this.props;
        this.active = this.findActive(tabs);
        return <div className={Tabless.container}>
            <ul className={`nav nav-tabs  ${Tabless.nav}`}>
                {tabs.map(this.renderTab, this)}
                {canAdd ? <li style={{float: 'right'}}>
                    <Inplace placeholder={placeholder} onChange={onAddTab}/>
                </li> : null}
            </ul>
            <div className={Tabless.items}>
                {this.props.children}
            </div>
        </div>
    }


}
