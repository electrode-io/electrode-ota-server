export const AppQueries = {
    deleteApp : `DELETE FROM app WHERE id = ?`,

    getAppByAppNameAndCollaboratorEmail : `SELECT a.id, a.name
                                            FROM app a, app_permission ap, user u
                                            WHERE a.id = ap.app_id
                                            AND ap.user_id = u.id
                                            AND u.email = ?
                                            AND a.name = ?`,

    getAppByDeploymentKey : `SELECT a.id, a.name
                            FROM app a, deployment_app da, deployment d
                            WHERE a.id = da.app_id
                            AND da.deployment_id = d.id
                            AND d.deployment_key = ?`,

    getAppById : `SELECT id, name
                FROM app
                WHERE id = ?`,

    getAppByName : `SELECT id, name
                    FROM app
                    WHERE name = ?`,

    insertApp : `INSERT INTO app
                (name)
                VALUES(?)`,

    updateAppName : `UPDATE app
                    SET name = ?
                    WHERE id = ?`,
};
