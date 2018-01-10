import Sequelize from "sequelize";

export default sequelize => {
  const ClientRatio = sequelize.define(
    "ClientRatio",
    {
      clientUniqueId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      packageHash: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      inserted: Sequelize.DATE,
      ratio: Sequelize.FLOAT,
      updated: Sequelize.BOOLEAN
    },
    {
      tableName: "client_ratio",
      createdAt: "inserted",
      indexes: [
        {
          fields: ["clientUniqueId", "inserted"]
        },
        {
          fields: ["packageHash"]
        }
      ],
      version: true
    }
  );
  ClientRatio.prototype.toJSON = function() {
    let asJson = this.get({ plain: true });
    delete asJson["version"];
    delete asJson["updatedAt"];
    return asJson;
  };
  return ClientRatio;
};
