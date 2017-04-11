import React, {Component} from 'react';
import Panel, {Heading, Footer, GroupItem, Body, Page} from '../../layouts/Panel';
import Confirm from '../../components/Confirm';
import AddAccessKey from './AddAccessKey';
import EditAccessKey from './EditAccessKey';
import {datetime as fmtDate} from '../../util/fmt';
import Busy from '../../components/BusyIndicator';
import Notify from '../Notify';

class AccessKeyItem extends Component {
    state = {};

    handleRemoveClick = (e)=> {
        e && e.preventDefault();
        this.setState({remove: this.props.name});
    };

    handleConfirmedRemove = (remove)=> {
        if (remove) {
            this.props.onRemoveAccessKey(remove)
        } else {
            this.props.onRemoveAccessKey();
        }
        this.setState({remove});
    };
    handlePatchAccessKey = ({oldName, newName, ttl})=> {
        const up = {
            oldName
        };
        if (ttl != this.props.editAccessKey.ttl) {
            up.ttl = ttl;
        }
        if (newName != oldName) {
            up.newName = newName;
        }
        this.props.onPatchAccessKey(this.props.idx, up);
    };

    handleEditClick = (e)=> {
        e && e.preventDefault();
        this.props.onEditSelect(this.props.idx, {
            oldName: this.props.name,
            newName: this.props.name,
            ttl: this.props.expires - Date.now()
        });
    };

    renderEdit() {
        return <EditAccessKey onCancel={this.props.onEditSelect}
                              onDismiss={this.props.onClearError}
                              onSubmit={this.handlePatchAccessKey}
                              {...this.props.editAccessKey}

        />
    }

    renderContent() {
        const {
            createdTime, expires, name
        } = this.props;
        return (<Confirm onConfirm={this.props.onRemoveAccessKey} confirm={this.state.remove}
                         message="Are you sure you want to remove">
                <span>
                    {name}
                    <dl className="dl-horizontal">
                        <dt>Created:</dt><dd>{fmtDate(createdTime)}</dd>
                        <dt>Expires:</dt><dd>{fmtDate(expires)}</dd>
                    </dl>
                    <div className="btn-group btn-edit-group">
                    <button className="btn btn-xs" onClick={this.handleEditClick}><i
                        className="fa fa-fw fa-pencil" aria-label="Edit"/></button>
                    <button className="btn btn-danger btn-xs" onClick={this.handleRemoveClick}><i
                        className="fa fa-fw fa-trash-o" aria-label="Remove"/></button>
                    </div>
                </span>
        </Confirm>);
    }

    render() {

        if (this.state.busy) {
            return <Busy message="Removing..."/>
        }
        return <GroupItem>{this.props.editAccessKey ? this.renderEdit() : this.renderContent()}</GroupItem>
    }
}

const accessKeyItemFactory = function (item, idx) {

    return <AccessKeyItem
        onRemoveAccessKey={this.onRemoveAccessKey}
        onPatchAccessKey={this.onPatchAccessKey}
        onClearError={this.onClearError}
        onEditSelect={this.onEditSelect}
        editAccessKey={this.editAccessKey && this.editAccessKey.idx == idx ? this.editAccessKey : null}
        idx={idx}
        key={`ak-${idx}`} {...item}/>;
};

export default class Profile extends Component {

    componentDidMount() {
        this.props.onAccountInfo();
        if (this.props.isStale) {
            this.props.onAccessKeys();
        }
    }

    componentWillReceiveProps(props) {
        if (props.isStale && (!this.props.isStale || props.isStale > this.props.isStale )) {
            props.onAccessKeys();
        }
    }

    handleClickAddBtn = (e)=> {
        this.props.onEditSelect(null, {});
    };

    render() {
        const {accessKeys = {}, accountInfo = {}, authorization:{host}, isAdding = false} = this.props;
        const {email, linkedProviders = [], name} = accountInfo.value || {};
        const {items} =accessKeys;

        return (
            <Page >
                <Busy isBusy={accountInfo.isFetching}>
                    <Panel>
                        <Heading label="Profile"/>
                        <Body>
                        <GroupItem>
                            <dl className="dl-horizontal">
                                <dt>Name:</dt>
                                <dd>{name}</dd>
                                <dt>Email:</dt>
                                <dd>{email}</dd>
                                <dt>Providers:</dt>
                                <dd>{linkedProviders.join(', ')}</dd>
								<dt>Host:</dt>
								<dd>{host}</dd>
                            </dl>
                        </GroupItem>
                        </Body>
                    </Panel>
                </Busy>
                <Panel>
                    <Heading label="Access Keys">{isAdding ? null :
                        <button className="btn btn btn-xs btn-primary pull-right"
                                onClick={this.handleClickAddBtn}>Add <i className="fa fa-key"></i></button>}
                    </Heading>
                    <Body>
                    <Notify parent="access-key"/>
                    <GroupItem>
                        <div className="clearfix">
                            {isAdding ?
                                <AddAccessKey onCancel={this.props.onEditSelect}
                                              onDismiss={this.props.onClearError}
                                              onSubmit={this.props.onAddAccessKey}
                                              onClearAccessKey={this.props.onClearAccessKey}
                                              {...this.props.editAccessKey}
                                /> :
                                null}
                        </div>
                        <Busy isBusy={accessKeys.isFetching}>
                            <ul className="list-group">{items.map(accessKeyItemFactory, this.props)}</ul>
                        </Busy>
                    </GroupItem>
                    </Body>
                </Panel>
            </Page>
        );
    }
}
