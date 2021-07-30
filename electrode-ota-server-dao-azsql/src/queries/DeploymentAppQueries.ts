export const DeploymentAppQueries = {
    deleteDeploymentAppByDeploymentId : `DELETE FROM deployment_app WHERE deployment_id = ?`,

    getDeploymentsByAppId : `SELECT d.id, d.deployment_key, d.name, d.create_time
                            FROM deployment_app da, deployment d
                            WHERE da.deployment_id = d.id
                            AND da.app_id = ?`,

    insertDeploymentApp : `INSERT INTO deployment_app
                            (app_id, deployment_id)
                            VALUES(?, ?)`,

};
