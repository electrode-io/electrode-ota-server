import React, {Component} from 'react';

const TIME = ((s = 1000, m, h, d, w, y)=>({
    s,
    m: (m = 60 * s),
    h: (h = 60 * m),
    d: (d = 24 * h),
    w: (w = 7 * d),
    y: (y = 365 * d)
}))();

const calcUnitState = (val)=> {
    if (!val) return {value: 0, unit: 'd'};
    for (const unit of ['y', 'd', 'h', 'm', 's']) {
        if (TIME[unit] < val) {
            return {value: Math.ceil(val * 10 / TIME[unit]) / 10, unit};
        }
    }
    return {value: 0, unit: 'd'};
};
const timeValue = (unit = 'd', value = 0)=> {
    return TIME[unit] * parseFloat(value, 10);
}
export default class Timeout extends Component {

    //Subschema uses this so we don't have to pass e.target.value in.
    static injectedPropTypes = {
        onChange: 'valueEvent'
    };

    state = calcUnitState(this.props.value);

    handleUnit = ({target:{value}})=> {
        this.setState({unit: value});
        this.props.onChange(timeValue(value, this.state.value));
    };

    handleValue = ({target:{value}})=> {
        this.setState({value});
    };

    handleBlur = ()=> {
        this.props.onChange(timeValue(this.state.unit, this.state.value));
    };

    render() {
        const {value, className = 'form-control', ...props} = this.props;
        return <div className="input-group" onBlur={this.handleBlur}>
            <input {...props} className={className} onChange={this.handleValue} value={this.state.value}/>
            <div className="input-group-addon">
                <select onChange={this.handleUnit} value={this.state.unit}>
                    <option value='s'>Seconds</option>
                    <option value='m'>Minutes</option>
                    <option value='h'>Hours</option>
                    <option value='d'>Days</option>
                    <option value='w'>Weeks</option>
                    <option value='y'>Years</option>
                </select>
            </div>
        </div>
    }


}