import React, {Component} from 'react';
import {types} from 'Subschema';

const {Select} = types;
const toOption = (val)=> {
    if (typeof val === 'string') {
        return {
            label: val,
            val
        }
    }
    return val;
};
export default class PathSelect extends Component {
    static injectedPropTypes = {options: 'value'};
    static displayName = 'PathSelect';
    static defaultProps = Select.defaultProps;
    static propTypes = Select.propTypes;

    render() {
        const {options, ...rest} = this.props
        return <Select {...rest} options={options.map(toOption)}/>
    }
}