"use strict";

import React, {Component} from 'react';

import SideBar from './SideBar';
import Link from './Link';
import Dropdown, {Divider, More} from './Dropdown';
import Progress from '../components/Progress';

const Message = ({from = "John Smith", time = "Yesterday", message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend...", href = "#"})=> (
    <a href={href}>
        <div>
            <strong>{from}</strong>
            <span className="pull-right text-muted">
            <em>{time}</em>
        </span>
        </div>
        <div>{message}</div>
    </a>);

export function Menus({children}) {
    return <ul className="nav navbar-top-links navbar-right">{children}</ul>
}


export default class NavContainer extends Component {
    state = {collapse: true};
    static defaultProps = {
        brand:''
    };

    navToggle = () => {

        this.setState({collapse: !this.state.collapse});
    };


    render() {
        const {collapse} = this.state;

        return (<nav className="navbar navbar-default navbar-static-top" role="navigation" style={{marginBottom: 0}}>
            <div className="navbar-header">
                <button type="button" className="navbar-toggle" data-toggle="collapse" onClick={this.navToggle}>
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>
                <Link className="navbar-brand" to="/app">{this.props.brand}</Link>
            </div>
            {this.props.children}
        </nav>);
    }
}
/*
 export default class Nav extends Component {
 state = {collapse: true};

 static injectedPropTypes = {
 sidebar: "valueEvent"
 };

 navToggle = () => {

 this.setState({collapse: !this.state.collapse});
 };


 render() {
 const {collapse} = this.state;

 return (<nav className="navbar navbar-default navbar-static-top" role="navigation" style={{marginBottom: 0}}>
 <div className="navbar-header">
 <button type="button" className="navbar-toggle" data-toggle="collapse" onClick={this.navToggle}>
 <span className="sr-only">Toggle navigation</span>
 <span className="icon-bar"></span>
 <span className="icon-bar"></span>
 <span className="icon-bar"></span>
 </button>
 <a className="navbar-brand" href="#">Walmart Over The Air Client</a>
 </div>

 <ul className="nav navbar-top-links navbar-right">
 <Dropdown type="envelope" count="3">
 <Message/>
 <Message from="Bob Loblaw"/>
 <Message time="2 days ago"/>
 <Message time="2 days ago"/>
 <Message time="Last week"/>
 <Divider/>
 <More>Read All Messages</More>
 </Dropdown>
 <Dropdown type="tasks">
 <a href="#">
 <Progress value={40} label="Task 1"/>
 </a>
 <a href="#">
 <Progress value={20} label="Task 2" level="info"/>
 </a>
 <a href="#">
 <Progress value={60} label="Task 3" level="warning"/>
 </a>
 <a href="#">
 <Progress value={80} label="Task 4" level="danger"/>
 </a>
 <More>See All Tasks</More>
 </Dropdown>
 <Dropdown type="alerts">
 <a href="#">
 <div>
 <i className="fa fa-comment fa-fw"></i> New Comment
 <span className="pull-right text-muted small">4 minutes ago</span>
 </div>
 </a>
 <Divider/>
 <a href="#">
 <div>
 <i className="fa fa-twitter fa-fw"></i> 3 New Followers
 <span className="pull-right text-muted small">12 minutes ago</span>
 </div>
 </a>
 <Divider/>
 <a href="#">
 <div>
 <i className="fa fa-envelope fa-fw"></i> Message Sent
 <span className="pull-right text-muted small">4 minutes ago</span>
 </div>
 </a>
 <Divider/>
 <a href="#">
 <div>
 <i className="fa fa-tasks fa-fw"></i> New Task
 <span className="pull-right text-muted small">4 minutes ago</span>
 </div>
 </a>
 <Divider/>
 <a href="#">
 <div>
 <i className="fa fa-upload fa-fw"></i> Server Rebooted
 <span className="pull-right text-muted small">4 minutes ago</span>
 </div>
 </a>
 <Divider/>
 <More>See All Alerts</More>
 </Dropdown>
 <Dropdown type='user'>
 <Link href="#/profile" icon="user">User Profile</Link>
 <Link href="#/settings" icon="gear">Settings</Link>
 <Divider/>
 <Link href="login.html" icon="sign-out">Logout</Link>
 </Dropdown>
 </ul>
 <SideBar path="sidebar.open"/>
 </nav>
 );
 }
 }*/
