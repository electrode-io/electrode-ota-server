import React from 'react';

export const Owner = ['Owner'];
export const Contributor = ['Contributor'];
export const Any = Owner.concat(Contributor);

export function hasPerm(collaborators, perms = Owner) {
    return Object.keys(collaborators).find(function (key) {
        const collaborator = this[key];
        return collaborator.isCurrentAccount && perms.indexOf(collaborator.permission) > -1;
    }, collaborators);
}


export default function Perm({collaborators, perms, children, invert}) {
    if (hasPerm(collaborators, perms)) {
        return (invert) ? <noscsript/> : children;
    }
    return (invert) ? children : <noscript/>;
}
