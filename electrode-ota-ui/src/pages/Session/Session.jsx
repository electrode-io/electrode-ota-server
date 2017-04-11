import React, {Component} from 'react';
import Panel, {Heading, Footer, GroupItem, Body, Page} from '../../layouts/Panel';
import Confirm from '../../components/Confirm';
import {datetime} from '../../util/fmt';
import Notify from '../Notify';

class SessionItem extends Component {

    state = {};

    handleRemoveConfirm = (confirm)=> {
        if (confirm) {
            this.props.onRemoveSession(confirm);
        }
        this.setState({remove: false});
    };

    handleRemoveClick = (e)=> {
        e && e.preventDefault();
        this.setState({remove: this.props.machineName});
    };

    render() {
        return (<GroupItem>
            <Confirm confirm={this.state.remove}
                     onConfirm={this.handleRemoveConfirm}
                     message="Are you sure you want to remove the session for machine ">
                <span>
                <dl className="dl-horizontal">
                    <dt>Machine Name</dt>
                    <dd>{this.props.machineName}</dd>
                    <dt>Logged In</dt>
                    <dd>{datetime(this.props.loggedInTime)}</dd>
                </dl>
                    <div className="btn-edit-group">
                        <button onClick={this.handleRemoveClick} className="btn btn-xs btn-danger pull-right"
                                aria-label="Remove Session"><i
                            className="fa fa-remove"/>
                        </button>
                    </div>
                </span>
            </Confirm>
        </GroupItem>);
    }
}

export default class Session extends Component {
    static defaultProps = {
        items: []
    };

    componentDidMount() {
        this.props.onGetSessions();
    }

    renderItem(item, idx) {
        return <SessionItem onRemoveSession={this.props.onRemoveSession} {...item} key={`si-${idx}`}/>
    }

    render() {
        const {sessions = []} = this.props;
        return (<Page label="Sessions">
            <Panel>
                <Heading>Active</Heading>
                <Body>
                <Notify parent="sessions"/>
                <GroupItem>
                    {sessions.map(this.renderItem, this)}
                </GroupItem>
                </Body>
            </Panel>
        </Page>);
    }
}
