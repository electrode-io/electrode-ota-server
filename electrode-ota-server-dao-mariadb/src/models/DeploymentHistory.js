import Sequelize from "sequelize";

export default sequelize =>
  sequelize.define(
    "DeploymentHistory",
    {},
    {
      tableName: "deployment_history",
      defaultScope: {
        order: [["createdAt", "DESC"]]
      },
      indexes: [{ fields: ["createdAt"] }],
      version: true
    }
  );
