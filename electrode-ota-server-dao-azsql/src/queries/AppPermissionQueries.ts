export const AppPermissionQueries = {
    deleteAppPermissionByAppId : `DELETE FROM app_permission WHERE app_id = ?`,

    deleteAppPermissionByUserEmail : `DELETE FROM app_permission
                                        WHERE app_id = ?
                                        AND user_id = (SELECT id FROM user WHERE email = ?)`,

    deleteAppPermissionByUserId : `DELETE FROM app_permission
                                    WHERE app_id = ?
                                    AND user_id = ?`,

    getAppPermissionsByAppId : `SELECT ap.app_id, ap.user_id, ap.permission, u.email
                                FROM app_permission ap, user u
                                WHERE ap.app_id = ?
                                AND ap.user_id = u.id`,

    getAppPermissionsByUserEmail : `SELECT ap.app_id, ap.user_id, ap.permission, u.email, a.name AS app_name,
                                    sub_ap.permission AS sub_permission, sub_user.email AS sub_email
                                    FROM app_permission ap, user u, app a, app_permission sub_ap, user sub_user
                                    WHERE ap.user_id = u.id
                                    AND ap.app_id = a.id
                                    AND u.email = ?
                                    AND ap.app_id = sub_ap.app_id
                                    AND sub_ap.user_id = sub_user.id
                                    ORDER BY ap.app_id`,

    getAppPermissionsByUserId : `SELECT app_id, user_id, permission
                                FROM app_permission
                                WHERE user_id = ?`,

    insertAppPermission : `INSERT INTO app_permission
                            (app_id, user_id, permission)
                            VALUES(?, ?, ?)`,

    insertAppPermissionWithEmail : `INSERT INTO app_permission
                                    (app_id, user_id, permission)
                                    VALUES(?, (SELECT id FROM user WHERE email = ?), ?)`,

    updateAppPermission : `UPDATE app_permission
                            SET permission = ?
                            WHERE app_id = ?
                            AND user_id = ?`,
};
