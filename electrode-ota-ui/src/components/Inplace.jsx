import React, {Component, findNode} from 'react';


export default class Inplace extends Component {

    static defaultProps = {
        className: 'edit-inline',
        iconCls: 'fa fa-pencil',
        type: 'text',
        onChange(){
        },
        onCancel(){

        }
    };

    state = {value: this.props.value};


    componentWillReceiveProps(props) {
        if (this.props.value != props.value) {
            this.setState({value: props.value});
        }

    }

    handleChange = ({target:{value}})=> {
        this.setState({value});
    };

    handleCommit = (e)=> {
        e && e.preventDefault();
        clearTimeout(this._to);
        const {value} = this.state;
        this.setState({value: this.props.value});
        if (value != this.props.value) {
            this.props.onChange(value);
        }

    };

    handleCancel = ()=> {
        this._to = setTimeout(()=>this.setState({value: this.props.value}), 500);
    };

    render() {
        const {onBlur, onChange, value, iconCls, onCancel, ...rest} = this.props;
        return <form onSubmit={this.handleCommit} className='edit-inline-form' onBlur={this.handleCancel}>
            <input {...rest} value={this.state.value || ''}
                   onChange={this.handleChange}/>
            <button type="submit" onClick={this.handleCommit}>
                <i className={iconCls}/>
            </button>
        </form>
    }
}