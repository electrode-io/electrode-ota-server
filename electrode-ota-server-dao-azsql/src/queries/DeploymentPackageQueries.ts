export const DeploymentPackageQueries = {
    deleteDeploymentPackageByDeploymentId : `DELETE FROM deployment_package_history WHERE deployment_id = ?`,

    deleteDeploymentPackageByPackageId : `DELETE FROM deployment_package_history WHERE package_id = ?`,

    getHistoryByDeploymentId : `SELECT dph.deployment_id, dph.package_id, dph.create_time, p.label
                                FROM deployment_package_history dph, package p
                                WHERE dph.deployment_id = ?
                                AND p.id = dph.package_id
                                ORDER BY create_time DESC, package_id DESC`,

    insertDeploymentPackageHistory : `INSERT INTO deployment_package_history
                                    (deployment_id, package_id)
                                    VALUES(?, ?)`,
};
