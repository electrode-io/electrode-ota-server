import Sequelize from 'sequelize';

export default (sequelize) => sequelize.define('DeploymentHistory', {
}, {
    tableName: "deployment_history",
    version: true
});