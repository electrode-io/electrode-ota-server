import Sequelize from "sequelize";
import _ from "lodash";

export default sequelize => {
  const AppCollaborator = sequelize.import("./AppCollaborator");
  const Deployment = sequelize.import("./Deployment");
  const App = sequelize.define(
    "App",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
      },
      name: Sequelize.STRING
    },
    {
      tableName: "apps",
      indexes: [{ fields: ["name"] }],
      version: true
    }
  );
  App.prototype.toJSON = function() {
    let collaborators = this.get("collaborators");
    collaborators = _.keyBy(collaborators, c => c.user);
    collaborators = _.mapValues(collaborators, c => ({
      permission: c.permission
    }));
    let deployments = this.get("deployments");
    deployments = _.map(deployments, (val, key) => val.name);
    if (_.isEmpty(deployments)) {
      deployments = null;
    }
    return {
      id: this.get("id", { plain: true }),
      name: this.get("name", { plain: true }),
      collaborators,
      deployments
    };
  };

  App.hasMany(AppCollaborator, { as: "collaborators", onDelete: "CASCADE" });
  App.hasMany(Deployment, { as: "deployments", onDelete: "CASCADE" });
  App._associations = {
    collaborators: { model: AppCollaborator, searchField: "user" },
    deployments: { model: Deployment, searchField: "id" }
  };

  return App;
};
