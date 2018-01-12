import { Sequelize, Model } from "sequelize";
import _ from "lodash";

export default sequelize => {
  const UserAccessKey = sequelize.import("./UserAccessKey");
  const User = sequelize.define(
    "User",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true
      },
      linkedProviders: {
        type: Sequelize.STRING(2048),
        get() {
          const val = this.getDataValue("linkedProviders");
          return val ? val.split(",") : [];
        },
        set(val) {
          if (val) {
            this.setDataValue("linkedProviders", val.join(","));
          }
        }
      },
      name: Sequelize.STRING
    },
    {
      tableName: "users",
      createdAt: "createdTime",
      indexes: [{ fields: ["email"] }],
      version: true
    }
  );

  User.prototype.toJSON = function() {
    let accessKeys = _.keyBy(this.accessKeys, c => c.key);
    accessKeys = _.mapValues(accessKeys, k => k.toJSON());
    return {
      id: this.get("id", { plain: true }),
      email: this.get("email", { plain: true }),
      name: this.get("name", { plain: true }),
      createdTime: this.get("createdTime", { plain: true }),
      linkedProviders: this.get("linkedProviders", { plain: true }),
      accessKeys
    };
  };

  User.hasMany(UserAccessKey, {
    as: "accessKeys",
    onDelete: "CASCADE"
  });
  User._associations = {
    accessKeys: { model: UserAccessKey, searchField: "key" }
  };
  User.prototype.createOrUpdateAssociate = function(values, options = {}) {
    const accessKey = _.find(this.accessKeys, { key: values.key });
    const valuesWithAssoc = Object.assign({}, values, { UserId: this.id });
    if (accessKey) {
      return accessKey.update(values, options);
    } else {
      return UserAccessKey.create(valuesWithAssoc, options);
    }
  };

  return User;
};
