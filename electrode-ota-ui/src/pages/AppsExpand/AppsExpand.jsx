import React, {Component} from 'react';
import InnerExpand from '../../layouts/Expand';
import {Link} from 'react-router';
import Busy from '../../components/BusyIndicator';

const liNameKey = ({name, id, deployments, href}, idx) =>
        deployments && deployments.length ?
            <InnerExpand preventDefault={false} href={href ||`/app/${name}/deployments/${deployments[0]}`}
                         key={`name-${id || idx}`} title={name} name={name}>
                {deployments.map((dep, idx)=><Link to={`/app/${name}/deployments/${dep}`}
                                                   key={`name-${id || idx}-${dep}`}>{dep}</Link>)}
            </InnerExpand>
            :
            <Link to={`/app/${name}`} key={`name-${id || idx}`}>{name}</Link>
    ;


export default class Expand extends Component {
    componentWillReceiveProps({isStale, open, onGetApps}) {
        if (open && isStale && this.props.isStale != isStale) {
            onGetApps();
        }
    }

    render() {
        const {props} = this;
        return <InnerExpand href="/app"
                            icon="cloud-upload" title="Apps"
                            onExpand={props.onExpand}
                            onDidExpand={props.onDidExpand}
                            open={props.open}>
            {props.isFetching ? <Busy/> : props.items.map(liNameKey)}
        </InnerExpand>
    }
}
