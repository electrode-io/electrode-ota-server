import React, {Component} from 'react';
import {PropTypes} from 'Subschema';

export default function CheckboxSpan(props) {

    return (<div className="checkbox">
        <label>
            {props.children}{props.title}
        </label>
    </div>);

}

CheckboxSpan.propTypes = {title:PropTypes.title};