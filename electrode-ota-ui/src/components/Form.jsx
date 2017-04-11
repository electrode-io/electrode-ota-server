import React, {Component} from 'react';
import {Form as SubForm} from 'Subschema';
import _loader from '../index';


export default class Form extends Component {
    static defaultProps = {
        className: 'form-container'
    };

    handleCancel = (e, action)=> {
        e && e.preventDefault();
        if (action === 'cancel') {
            this.props.onCancel && this.props.onCancel();
        }
    };

    handleSubmit = (e, err, value)=> {

        if (err != null && Object.keys(err).length != 0) {
            return;
        }

        this.props.onSubmit && this.props.onSubmit(value);
    };

    render() {
        const {loader = _loader, className, children, onCancel, onSubmit, ...rest} = this.props;
        return <span className={className}><SubForm {...rest}
                                                    onButtonClick={this.handleCancel} onSubmit={this.handleSubmit}
                                                    loader={loader}>{children}</SubForm></span>
    }
}
