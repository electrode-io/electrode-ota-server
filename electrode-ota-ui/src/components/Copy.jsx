import React from 'react';

import Clipboard from 'react-copy-to-clipboard';


export default function Copy({text, className = 'clipboard', ...props}) {
	return <span className={className}>
		<span className="clipboard-text">{`${text}`}</span>
		<Clipboard text={text} {...props}><button className="btn btn-xs btn-default"><i
			className="fa fa-sw fa-copy"/></button></Clipboard>
	</span>
}
