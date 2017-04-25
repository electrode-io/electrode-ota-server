import bindAllTo from './bindAllTo';
export default  (stateProps, dispatchProps, ownProps)=> ({...ownProps, ...bindAllTo(dispatchProps, stateProps), ... stateProps});
