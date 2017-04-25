export const event = (type, conf = {}) => (value, ...args) => {
    const ret = {
        type,
        ...conf
    };
    if (value != null) {
        ret.value = value;
    }
    Object.assign(ret, ...args);
    return ret;
};

export const asEvent = (type, ...args)=> {
    return (typeof type === 'string') ? event(type, ...args) : type;
};


function argmap(arg) {
    return this[arg];
}

//Creates a function that fires an event as a Promise.
export const asAsyncEvent = (...evt) => {
    const evtF = asEvent(...evt);
    return (...args) => dispatch => Promise.resolve(evtF(...args)).then(dispatch);
};
export const makeManageAction = (method, type, receiveType, ...args)=> (host, token, obj, payload)=> dispatch=> Promise.resolve({
    type,
    receiveType,
    method,
    value: args.map(argmap, obj),
    authorization: {host, token},
    payload
}).then(dispatch);


export default({
    asAsyncEvent,
    asEvent,
    event,
    makeManageAction
});



