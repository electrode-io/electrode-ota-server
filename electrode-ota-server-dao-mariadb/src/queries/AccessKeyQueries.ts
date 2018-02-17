export const AccessKeyQueries = {
    deleteAccessKeyById : `DELETE FROM access_key WHERE id = ?`,

    getAccessKeysByUserId : `SELECT id, name, create_time,
                            created_by, expires, last_access,
                            friendly_name, description
                            FROM access_key
                            WHERE user_id = ?`,

    insertAccessKey : `INSERT INTO access_key
                        (user_id, name, created_by,
                        expires, friendly_name, description)
                        VALUES(?, ?, ?,
                        ?, ?, ?)`,

    updateAccessKey : `UPDATE access_key
                        SET last_access = ?,
                        friendly_name = ?,
                        expires = ?
                        WHERE id = ?`,

};
