import Sequelize from "sequelize";
import _ from "lodash";
import assert from "assert";

export default sequelize => {
  const Package = sequelize.import("./Package");
  const DeploymentHistory = sequelize.import("./DeploymentHistory");

  let Deployment = sequelize.define(
    "Deployment",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
      },
      key: Sequelize.STRING,
      name: Sequelize.STRING
    },
    {
      tableName: "deployments",
      indexes: [{ fields: ["key"] }, { fields: ["name"] }],
      createdAt: "createdTime",
      version: true
    }
  );
  Deployment.belongsToMany(Package, {
    as: "history_",
    through: DeploymentHistory,
    foreignKey: "deploymentId",
    otherKey: "packageId"
  });
  Deployment._associations = {
    history_: {
      model: Package,
      searchField: "packageId",
      through: DeploymentHistory,
      attributes: ["id_"],
      // Sort history_ by created DESC
      order: [
        { model: Package, as: "history_", through: DeploymentHistory },
        "created_",
        "DESC"
      ]
    }
  };

  Deployment.prototype.toJSON = function() {
    let asJson = this.get({ plain: true });
    asJson.history_ = _.map(asJson.history_, p => p.id_);
    return asJson;
  };
  Deployment.prototype.associate = function(pkg, options = {}) {
    assert(pkg != null, "Associating null package to Deployment");
    assert(
      pkg instanceof Package,
      "Only Package can be associated to Deployment"
    );
    return this.addHistory_(pkg, options);
  };

  return Deployment;
};
