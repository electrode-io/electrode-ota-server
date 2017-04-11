import React, {Component} from 'react';


export default class Details extends Component {

	static defaultProps = {
		legend: ""
	};

	state = {};

	handleCheckChange = ({target:{checked}})=> {
		this.setState({checked});
	};

	render() {
		return (<fieldset>
			<legend>{this.props.legend} <input type="checkbox" onChange={this.handleCheckChange}/></legend>
			{this.state.checked ? this.props.children : null}
		</fieldset>)
	}


}
