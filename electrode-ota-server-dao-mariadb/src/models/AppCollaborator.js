import Sequelize from "sequelize";

export default sequelize => {
  let AppCollaborator = sequelize.define(
    "AppCollaborator",
    {
      user: Sequelize.STRING,
      permission: Sequelize.STRING
    },
    {
      tableName: "app_collaborators",
      indexes: [{ fields: ["user", "AppId"], unique: true }],
      version: true
    }
  );
  return AppCollaborator;
};
