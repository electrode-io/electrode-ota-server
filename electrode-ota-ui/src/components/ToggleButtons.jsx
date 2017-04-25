import React, {Component} from 'react';
import ToggleButton from './ToggleButton';

export default class ToggleButtons extends Component {

    static defaultProps = {
        className: 'btn-group'
    };
    handleBtnClick = (btn, e)=> {
        e && e.preventDefault();
        this.props.onClick && this.props.onClick(
            this.isActive(btn) ? void(0) : btn.action,
            btn
        );
    };

    isActive(btn) {
        return btn && this.props.active == btn.action;
    }

    renderBtn(btnObj, idx) {
        return <ToggleButton {...btnObj}
                             active={this.isActive(btnObj)}
                             onToggle={this.handleBtnClick.bind(this, btnObj)} data-idx={idx} key={`tb-${idx}`}/>
    }

    render() {
        return <div className={this.props.className}>
            {this.props.buttons.map(this.renderBtn, this)}
        </div>

    }


}