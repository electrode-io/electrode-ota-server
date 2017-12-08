import Sequelize from 'sequelize';

export default (sequelize) => {
    const Metric = sequelize.define('Metric', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
        },
        deploymentKey: Sequelize.STRING,
        appVersion: Sequelize.STRING,
        clientUniqueId: Sequelize.STRING,
        label: Sequelize.STRING,
        previousDeploymentKey: Sequelize.STRING,
        previousLabelOrAppVersion: Sequelize.STRING,
        status: Sequelize.STRING
    }, {
        tableName: "metrics",
        indexes: [
            { fields: ["deploymentKey"] }
        ],
        version: true
    });
    Metric.prototype.toJSON = function() {
        let asJson = this.get({plain:true});
        delete asJson["updatedAt"];
        delete asJson["createdAt"];
        delete asJson["version"];
        return asJson;
    }
    return Metric;
};