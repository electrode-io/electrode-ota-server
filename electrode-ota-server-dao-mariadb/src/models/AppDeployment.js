import Sequelize from 'sequelize';

export default (sequelize) => sequelize.define('AppDeployment', {
}, {
    tableName: "app_deployments",
    version: true
});