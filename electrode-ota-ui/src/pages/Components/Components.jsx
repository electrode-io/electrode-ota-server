import React, {Component} from 'react';

import Inplace from '../../components/Inplace';
import Panel, {Page, Heading, Footer, Body, GroupItem} from '../../layouts/Panel';
import Notify from '../../components/Notify';
import BusyIndicator from '../../components/BusyIndicator';
import Timeout from '../../components/Timeout';
import ToggleButtons from '../../components/ToggleButtons';

export default class Components extends Component {

    state = {
        inplace1: '',
        inplace2: 'Hello World',
        notify1: true,
        notify2: false,
        notify3: true,
        level: 'info',
        busy: true,
        message: 'Loading...',
        timeout: 3000
    };

    onChangeInplace1 = (inplace1)=> {
        this.setState({inplace1});
    };
    onChangeInplace2 = (inplace2)=> {
        this.setState({inplace2});
    };
    onNotify1 = ()=> {
        this.setState({notify1: !this.state.notify1});
    };
    onNotify2 = ()=> {
        this.setState({notify2: !this.state.notify2});
    };
    onNotify3 = ()=> {
        this.setState({notify3: !this.state.notify3});
    };
    onValueChange = (name, value)=> {
        this.setState({[name]: value});
    };
    onCheckChange = ({target:{checked, name}})=>this.setState({[name]: checked});
    onTextChange = ({target:{value, name}}) =>this.setState({[name]: value});

    render() {
        return <div className="container-fluid">
            <Page>

                <h1>Components</h1>
                <p>Just a little page to show component functionality, mostly to ease development.</p>
                <Panel>
                    <Heading label="Inline"/>
                    <Body>
                    <GroupItem
                        label={<span>Inline Empty:<Inplace onChange={this.onChangeInplace1} value={this.state.inplace1}
                                                           name="inplace1"/></span>}>
                        <p>Value:{this.state.inplace1}</p>
                    </GroupItem>
                    <GroupItem label={<span>Inline With Text:<Inplace onChange={this.onChangeInplace2}
                                                                      value={this.state.inplace2}
                                                                      name="inplace2"/></span>}>

                        <p>Value:{this.state.inplace2}</p>

                    </GroupItem>
                    </Body>
                </Panel>
                <Panel>
                    <Heading label="Notify"/>
                    <Body>

                    <GroupItem label="Shown Error">
                        <input type="checkbox" onChange={this.onCheckChange} checked={this.state.notify1} value="on"
                               name="notify1"/>
                        <Notify parent="notify1" error="This is an error"
                                isError={this.state.notify1}
                                onDismiss={this.onNotify1}/></GroupItem>
                    <GroupItem label="Hidden Error">
                        <input type="checkbox" onChange={this.onCheckChange} checked={this.state.notify2} value="on"
                               name="notify2"/>
                        <Notify parent="notify2" error="This is an error"
                                isError={this.state.notify2}
                                onDismiss={this.onNotify2}/>
                    </GroupItem>
                    <GroupItem label="Show Info">
                        <label>
                            <input type="checkbox" name="notify3" onChange={this.onCheckChange} checked={this.state.notify3} value="on"/>
                            <select value={this.state.level} onChange={this.onTextChange} name="level">
                                <option>info</option>
                                <option>success</option>
                                <option>warning</option>
                                <option>danger</option>
                            </select>
                        </label>
                        <Notify parent="notify3" level={this.state.level} name="notify3" action={this.state.notify3 ? 'shown' : false}
                                onDismiss={this.onNotify3}/>
                    </GroupItem>
                    </Body>
                </Panel>
                <Panel>
                    <Body>
                    <GroupItem label="Busy">
                        <input type="checkbox" name="busy" checked={this.state.busy} onChange={this.onCheckChange}/>
                        <input type="text" name="message" onChange={this.onTextChange} value={this.state.message}/>
                        <BusyIndicator isBusy={this.state.busy} message={this.state.message}>
                            <div>
                                <h3>I was busy but now I'm not</h3>
                                <p>However, previous state does not necessarily indicate future state.</p>
                                <h3>I was busy but now I'm not</h3>
                                <p>However, previous state does not necessarily indicate future state.</p>
                                <h3>I was busy but now I'm not</h3>
                                <p>However, previous state does not necessarily indicate future state.</p>
                            </div>
                        </BusyIndicator>

                    </GroupItem>
                    </Body>
                </Panel>
                <Panel>
                    <Heading label="Timeout"/>
                    <Body>
                    <GroupItem>
                        <div className="input-group">
                            <Timeout name="timeout" onChange={this.onValueChange.bind(this, 'timeout')}
                                     value={this.state.timeout}/>
                            <p>value in ms:{this.state.timeout || 0}</p>
                        </div>
                    </GroupItem>
                    </Body>
                </Panel>
                <Panel>
                    <Heading label="Toggle Buttons"/>
                    <Body>
                    <GroupItem>
                        <p>ToggleButtons allow only one item to be active at a time. Clicking an active item makes it
                            inactive</p>
                        <ToggleButtons onClick={this.onValueChange.bind(this, 'toggle')} active={this.state.toggle}
                                       buttons={[{
                                           action: 'revert',
                                           icon: 'history'
                                       },
                                           {
                                               action: 'edit',
                                               icon: 'pencil',

                                           }, {
                                               action: 'promote',
                                               icon: 'arrow-circle-up'
                                           }]}/>
                        <p>
                            Active Button : {this.state.toggle || 'None'}
                        </p>
                    </GroupItem>
                    </Body>
                </Panel>
            </Page>
        </div>
    }
}
