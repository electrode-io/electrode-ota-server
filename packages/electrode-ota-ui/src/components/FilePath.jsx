import React, {Component} from 'react';


export default class FilePath extends Component {

	static injectedPropTypes = {
		"onChange": "valueEvent"
	};
	
	handleFileChange = ({target:{value, files:[file]}})=> {
		this.props.onChange(file && file.path || value);
	};

	render() {
		const {onChange, value, ...props} = this.props;
		return <input type="file" {...props} onChange={this.handleFileChange}/>
	}
}
