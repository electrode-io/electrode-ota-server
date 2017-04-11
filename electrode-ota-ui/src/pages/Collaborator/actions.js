export const CONFIRM_COLLABORATOR = 'CONFIRM_COLLABORATOR';

export const REMOVE_COLLABORATOR = 'REMOVE_COLLABORATOR';
export const REMOVED_COLLABORATOR = 'REMOVED_COLLABORATOR';

export const ADD_COLLABORATOR = 'ADD_COLLABORATOR';
export const ADDED_COLLABORATOR = 'ADDED_COLLABORATOR';


export const confirm = (appName, value)=> ({
    type: CONFIRM_COLLABORATOR,
    value: [appName, value]
});

export const remove = (appName, collaborator, authorization)=>({
    type: REMOVE_COLLABORATOR,
    method: 'removeCollaborator',
    receiveType: REMOVED_COLLABORATOR,
    authorization,
    value: [appName, collaborator]
});

export const add = (appName, collaborator, authorization)=>({
    type: ADD_COLLABORATOR,
    method: 'addCollaborator',
    receiveType: ADDED_COLLABORATOR,
    value: [appName, collaborator],
    authorization
});

