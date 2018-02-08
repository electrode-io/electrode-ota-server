import Sequelize from "sequelize";
import {
  encryptField
} from "./helper";

export default sequelize => {
  let AppCollaborator = sequelize.define(
    "AppCollaborator", {
      user: encryptField(sequelize, "user", {
        type: Sequelize.STRING
      }),
      permission: Sequelize.STRING
    }, {
      tableName: "app_collaborators",
      indexes: [{
        fields: ["user", "AppId"]
      }],
      version: true
    }
  );
  return AppCollaborator;
};
