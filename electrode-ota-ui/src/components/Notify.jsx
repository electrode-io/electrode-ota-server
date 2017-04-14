import React, {Component} from 'react';
import Warning from './ErrorMessage';
import TransitionHeight from 'subschema/src/transition/ReactCSSReplaceTransition';

export const Options = {
    defaultMessage(action, name){
        return `Successfully ${action} "${name}"`
    },
    messages: {},
    timeout: 30000,
    transitionLeaveTimeout: 300,
    transitionEnterTimeout: 300,
    transitionAppearTimeout: 300,
    transitionHeightClass: "height-transition",
    transitionName: {
        enter: 'enter',
        //  enterActive: 'scollapsing',
        leave: 'leave',
        appear: 'appear'
        //leaveActive: 'scollapsing',
    }
};

function resolve(options, action, name) {
    if (options.messages[name]) {
        if (typeof options.messages[name] == 'function') {
            return options.messages[name](action, name);
        }
        return options.messages[name];
    }
    return options.defaultMessage(action, name);
}

export default class Notify extends Component {

    static defaultProps = Options;


    componentWillReceiveProps(props) {
        if (!(this.props.parent === props.parent && this.props.name != props.name)) {
            clearTimeout(this._to);
        }
        if ((props.action && props.action != this.props.action) || (props.isError && props.isError != this.props.isError)) {
            clearTimeout(this._to);
            this._to = setTimeout(this.handleRemove, props.timeout);
        }
    }

    componentDidMount() {
        const props = this.props;
        if (props.action || props.isError) {
            clearTimeout(this._to);
            this._to = setTimeout(this.handleRemove, props.timeout);
        }

    }

    componentWillUnmount() {
        clearTimeout(this._to);
//        this.handleRemove();
        this.showed = false;
    }

    handleRemove = ()=> {
        clearTimeout(this._to);
        if (this.showed) {
            this.props.onDismiss(this.props.parent);
            this.showed = false;
        }
    };

    notify({action, isError, error, onDismiss, name, className, level = "success"}) {
        if (!(isError || action)) {
            return null;
        }
        this.showed = true;
        if (isError) {
            return <Warning key="error" className={className} isError={isError} error={error}
                            onDismiss={this.handleRemove}/>
        }
        return <Warning key="warning" isError={true} className={className} level={level}
                        error={resolve(this.props, action, name)}
                        onDismiss={onDismiss}/>;

    }

    render() {
        return <TransitionHeight
            component="div"
            className="custom-alert"
            transitionLeaveTimeout={this.props.transitionLeaveTimeout}
            transitionEnterTimeout={this.props.transitionEnterTimeout}
            transitionAppearTimeout={this.props.transitionAppearTimeout}
            transitionHeightClass={this.props.transitionHeightClass}
            transitionName={this.props.transitionName}>
            {this.notify(this.props)}
        </TransitionHeight>

    }
}