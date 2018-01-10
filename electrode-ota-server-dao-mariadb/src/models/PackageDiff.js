import Sequelize from "sequelize";

export default sequelize => {
  const PackageDiff = sequelize.define(
    "PackageDiff",
    {
      packageHash: Sequelize.STRING(191),
      size: Sequelize.BIGINT.UNSIGNED,
      url: Sequelize.STRING(2048)
    },
    {
      tableName: "packages_diff",
      indexes: [{ fields: [{ attribute: "createdAt", order: "DESC" }] }],
      version: true
    }
  );

  return PackageDiff;
};
