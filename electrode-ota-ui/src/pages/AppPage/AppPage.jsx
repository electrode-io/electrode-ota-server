import React, {Component} from 'react';
import Perm, {hasPerm}  from '../../components/Perm';
import Confirm from '../../components/Confirm';
import Notify from '../Notify';

import Tabs from '../../components/Tabs';
import Inplace from '../../components/Inplace';
import Panel, {Page, Heading, Footer, GroupItem, Body} from '../../layouts/Panel';
import {Link} from 'react-router';
import Collaborator from '../Collaborator';

//Scope dependent
const depLink = function (dep, idx) {
    return <Link to={`/app/${this}/deployments/${dep}`} key={`dep-${idx}`}>{dep}</Link>
};

const filterPerm = function (email) {
    return this[email].permission === 'Owner';
};

const findOwner = (collaborators) => Object.keys(collaborators).find(filterPerm, collaborators);


export default class AppPage extends Component {

    state = {name: this.props.name};

    componentWillReceiveProps({name}) {
        if (this.props.name !== name) {
            this.setState({name});
        }
    }

    handleConfirmRename = (newName)=> {
        if (newName) {
            this.setState({newName: false});
            this.props.onRenameApp(newName);
        } else {
            this.setState({name: this.props.name, newName: false});
        }
    };

    handleConfirmRemove = (name)=> {
        if (name) {
            this.props.onRemoveApp();
        }
        this.setState({remove: false});

    };
    handleConfirmTransfer = (transfer)=> {
        if (transfer) {
            this.props.onTransferApp(transfer);
        }
        this.setState({transfer: false});
    };

    handleNameSubmit = (newName)=> {
        this.setState({newName});
    };
    handleTransferSubmit = (transfer)=> {
        this.setState({transfer});
    };

    handleRemove = (e)=> {
        e && e.preventDefault();
        this.setState({remove: this.props.name});
    };

    render() {
        let {deployments = [], collaborators = {}, description = '', name} = this.props;
        if (deployments == null) deployments = [];
        const label = hasPerm(collaborators) ?
            <Confirm onConfirm={this.handleConfirmRename} confirm={this.state.newName}
                     message={`Are you sure you want to rename "${name}" to `}>
                <Inplace onChange={this.handleNameSubmit} value={name}/>
            </Confirm> : name;
        return (<Page label="Application">
            <Panel>
                <Heading label={label} labelClass="panel-title">

                    <Perm collaborators={collaborators}>
                        <Confirm confirm={this.state.remove} onConfirm={this.handleConfirmRemove}
                                 message="Are you sure you want to delete this app">
                            <button className="btn  btn-xs btn-danger btn-app-delete pull-right btn-top-right"
                                    onClick={this.handleRemove}
                                    aria-label="Remove App">
                                <i className="fa fa-icon fa-fw fa-remove "/>
                            </button>
                        </Confirm>
                    </Perm>
                </Heading>
                <Body>
                <Notify parent={`app-${name}`}/>
                <GroupItem label="Collaborators" className="list-group-item clearfix nobottom-line">
                    <Collaborator collaborators={collaborators} app={name}/>
                </GroupItem>
                <Tabs tabs={deployments.sort().map(label=>({to: `/app/${name}/deployments/${label}`, label}))}
                      onAddTab={this.props.onAddDeployment}
                      placeholder="+ Add Deployment"
                      canAdd={hasPerm(collaborators)}>
					<Notify parent={`deployment-${name}`} className="tab-alert"/>
                    {this.props.children}
                </Tabs>
                <GroupItem>
                </GroupItem>
                </Body>
                <Footer>
                    <small>{description}</small>
                    <Perm collaborators={collaborators}>
                        <Confirm confirm={this.state.transfer} onConfirm={this.handleConfirmTransfer}
                                 message="Are you sure you want to transfer this app" className="pull-left">
                            <span className="inline"> Owner: <Inplace value={findOwner(collaborators)}
                                                                      onChange={this.handleTransferSubmit}/></span>
                        </Confirm>
                    </Perm>
                    <Perm collaborators={collaborators} invert={true}>
                        <span className="inline">Owner: {findOwner(collaborators)}</span>
                    </Perm>
                </Footer>
            </Panel>
        </Page>);
    }

}
