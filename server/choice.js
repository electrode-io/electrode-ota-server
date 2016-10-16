const register = (weight, client) => {
    return Math.random() < (weight / 100);
};

register.attributes = {
    name: 'client-choice',
    description:'Determines if the rollout is less than 100% if this client gets it.  Use to plugin more sophisticated logic.'
};

module.exports = {register};