import Sequelize from "sequelize";
import _ from "lodash";

/**
 * Associated to the User model.
 */
export default sequelize => {
  const UserAccessKey = sequelize.define(
    "UserAccessKey",
    {
      key: {
        type: Sequelize.STRING(191),
        primaryKey: true
      },
      id: Sequelize.STRING,
      name: Sequelize.STRING,
      expires: Sequelize.DATE,
      description: Sequelize.STRING(2048),
      lastAccess: Sequelize.DATE,
      createdBy: Sequelize.STRING,
      friendlyName: Sequelize.STRING
    },
    {
      tableName: "users_access_key",
      createdAt: "createdTime",
      version: true
    }
  );
  UserAccessKey.prototype.toJSON = function() {
    const option = { plain: true };
    return {
      id: this.get("id", option),
      name: this.get("name", option),
      expires: this.get("expires", option),
      description: this.get("description", option),
      lastAccess: this.get("lastAccess", option),
      createdBy: this.get("createdBy", option),
      friendlyName: this.get("friendlyName", option)
    };
  };
  return UserAccessKey;
};
