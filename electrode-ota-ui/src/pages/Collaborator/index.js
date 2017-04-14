import Collaborator from './Collaborator';
import {connect} from 'react-redux';
import {confirm, remove, add} from './actions';
import boundDispatched from '../../util/boundDispatched';

const mapStateToProps = (state, props)=> {

    const {collaborators} = props;
    const {collaborator:{name, ...rest}, authorization} = state || {};
    return {
        authorization,
        collaborators,
        collaborator: name,
        ...rest
    }
};

const mapDispatchToProps = (dispatch, {app})=> ({
    onRemoveCollaborator(collaborator){
        if (collaborator) {
            dispatch(remove(app, collaborator, this.authorization));
        } else {
            dispatch(confirm(app));
        }
    },
    onAddCollaborator(collaborator){
        dispatch(add(app, collaborator, this.authorization));
    },
    onConfirmRemoveCollaborator(collaborator){
        dispatch(confirm(app, collaborator));
    }
});

export default connect(mapStateToProps, mapDispatchToProps, boundDispatched)(Collaborator);
