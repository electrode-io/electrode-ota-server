import React, {Component} from 'react';
import {connect} from 'react-redux';
import boundDispatched from '../../util/boundDispatched';
import AddApp from './AddApp';
import {addApp} from '../AppPage/actions';
import {navigate} from '../Shell/actions';

export default connect(({addApp = {}, authorization})=>({addApp, authorization}), (dispatch)=> ({

    onCreate(value)
    {
        const {authorization:{host, token}} =  this;
        return dispatch(addApp(host, token, value))
            .then(({isError})=>isError ? null : dispatch(navigate(`/app/${value.name}/deployments/Production`)));
    }

}), boundDispatched)(AddApp);