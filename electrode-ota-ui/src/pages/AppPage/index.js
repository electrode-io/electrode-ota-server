import React, {Component} from 'react';
import appPageDispatchToProps from './dispatch';
import boundDispatched from '../../util/boundDispatched';
import {connect} from 'react-redux';
import AppPage from './AppPage';
import Busy from '../../components/BusyIndicator';

class ConnectAppPageInner extends Component {
    componentDidMount() {
        this.props.fetch(this.props);
    }

    componentWillReceiveProps(props) {
        if (props.name != this.props.name || props.isStale) {
            this.props.fetch(props);
        }
    }

    render() {
        const {fetch, authorization, params, isFetching, ...rest} = this.props;
        return <Busy isBusy={isFetching}><AppPage {...rest}/></Busy>
    }
}


export default connect(({selectedApp, authorization}, {params:{name, deployment}})=> ({
    authorization,
    ...selectedApp,
    name, deployment
}), appPageDispatchToProps, boundDispatched)(ConnectAppPageInner);
