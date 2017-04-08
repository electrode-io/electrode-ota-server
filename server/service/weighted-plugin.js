const diregister = require('../diregister');
const weighted = (weight) => {
    return Math.random() < (weight / 100);
};
const register = diregister({
    name: 'ota!weighted',
    multiple: false,
    connections: false,
    dependencies: []
}, () => weighted);

module.exports = {
    weighted,
    register
};

