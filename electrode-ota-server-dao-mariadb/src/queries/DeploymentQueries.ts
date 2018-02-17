export const DeploymentQueries = {
    deleteDeploymentById : `DELETE FROM deployment WHERE id = ?`,

    getDeploymentByKey : `SELECT id, name, create_time, deployment_key
                        FROM deployment
                        WHERE deployment_key = ?`,

    getDeploymentsByAppId : `SELECT d.id, d.name, d.create_time, d.deployment_key
                        FROM deployment d, deployment_app da, app a
                        WHERE d.id = da.deployment_id
                        AND a.id = da.app_id
                        AND a.id = ?`,

    insertDeployment : `INSERT INTO deployment
                        (name, deployment_key)
                        VALUES(?, ?)`,

    updateDeploymentName : `UPDATE deployment
                            SET name = ?
                            WHERE id = ?`,
};
