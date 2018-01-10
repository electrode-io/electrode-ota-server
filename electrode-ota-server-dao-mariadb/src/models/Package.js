import Sequelize from "sequelize";
import _ from "lodash";

export default sequelize => {
  const PackageDiff = sequelize.import("./PackageDiff");
  const Package = sequelize.define(
    "Package",
    {
      id_: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
      },
      appVersion: Sequelize.STRING,
      blobUrl: Sequelize.STRING(2048),
      description: Sequelize.STRING(2048),
      isDisabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isMandatory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      label: Sequelize.STRING,
      manifestBlobUrl: Sequelize.STRING(2048),
      originalDeployment: Sequelize.STRING,
      originalLabel: Sequelize.STRING,
      packageHash: Sequelize.STRING(191),
      releaseMethod: Sequelize.STRING,
      releasedBy: Sequelize.STRING,
      rollout: Sequelize.INTEGER,
      size: Sequelize.BIGINT.UNSIGNED,
      uploadTime: Sequelize.DATE
    },
    {
      tableName: "packages",
      createdAt: "created_",
      indexes: [
        {
          fields: ["label"]
        }
      ],
      defaultScope: {
        order: [["created_", "DESC"]]
      },
      version: true
    }
  );

  Package.hasMany(PackageDiff, {
    as: "diffPackageMap",
    foreignKey: "packageId",
    onDelete: "CASCADE"
  });
  Package._associations = {
    diffPackageMap: { model: PackageDiff, searchField: "packageHash" }
  };

  Package.prototype.createOrUpdateAssociate = function(updates) {
    const packDiff = _.find(this.diffPackageMap, {
      packageId: this.id_,
      packageHash: updates.packageHash
    });
    if (packDiff) {
      return packDiff.update(updates);
    } else {
      return PackageDiff.create(
        _.assign(updates, {
          packageId: this.id_,
          packageHash: updates.packageHash
        })
      ).then(packageDiff => {
        this.diffPackageMap.push(packageDiff);
        return packageDiff;
      });
    }
  };

  Package.prototype.toJSON = function() {
    let asJson = this.get({ plain: true });
    asJson.diffPackageMap = _.keyBy(
      asJson.diffPackageMap,
      pkg => pkg.packageHash
    );
    return asJson;
  };
  return Package;
};
