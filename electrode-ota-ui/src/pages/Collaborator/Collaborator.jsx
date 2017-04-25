import React, {Component} from 'react';

import Perm from '../../components/Perm';
import Confirm from '../../components/Confirm';
import Busy from '../../components/BusyIndicator';
import Tags from '../../components/Tags';
import Notify from '../Notify';

const _renderTag = function ({tag, key, onRemove, getTagDisplayValue, classNameRemove, ...other}) {
    const collab = this[tag] || {};
    return (<span key={key} {...other}>
            {getTagDisplayValue(tag)}
        {collab.isCurrentAccount ? null : <a onClick={(e) => onRemove(key)}/>}
        </span>);
};


export default function Collaborator({
    //dispatch
    onAddCollaborator, onRemoveCollaborator, onConfirmRemoveCollaborator,

    //state
    isFetching = false, collaborator, isError, error, completed, confirm, app = '',

    //params
    collaborators = {},

    //configure
    msgSaving = 'Saving...',
    msgAddCollaborator = '+ Add a collaborator',
    msgConfirm = 'Are you sure you want to remove the collaborator',
    renderTag = _renderTag

}) {
    return (<Busy isBusy={isFetching} message={msgSaving} className="collaborators">
        <Perm collaborators={collaborators}>
            <Confirm confirm={confirm && collaborator} message={msgConfirm}
                     onConfirm={onRemoveCollaborator}>
                <Tags inputProps={{placeholder: msgAddCollaborator}}
                      className={isError ? ' react-tagsinput has-error ' : ' react-tagsinput '}
                      renderTag={renderTag.bind(collaborators)}
                      value={Object.keys(collaborators).filter(filterNotOwner, collaborators)}
                      onAdd={onAddCollaborator}
                      onRemove={onConfirmRemoveCollaborator}/>
                <Notify parent={`collaborator-${app}`} className="under-alert"/>
            </Confirm>
        </Perm>
        <Perm collaborators={collaborators} invert={true}>
            <span>{Object.keys(collaborators).join(', ')}</span>
        </Perm>
    </Busy>);
}

const filterNotOwner = function (collaborator) {
    return this[collaborator].permission != 'Owner';
};
