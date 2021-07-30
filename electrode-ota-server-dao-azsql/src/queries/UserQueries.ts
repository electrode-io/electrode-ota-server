export const UserQueries = {
    getUserByAccessKey : `SELECT u.id, u.email, u.create_time, u.name
                        FROM user u, access_key ak
                        WHERE u.id = ak.user_id
                        AND ak.name = ?`,

    getUserByEmail : `SELECT id, email, create_time, name
                    FROM user
                    WHERE email = ?`,

    getUserById : `SELECT id, email, create_time, name
                    FROM user
                    WHERE id = ?`,

    getUsersByEmails : `SELECT id, email, create_time, name
                        FROM user
                        WHERE email IN ?`,

    insertUser : `INSERT INTO user
                (email, name)
                VALUES(?, ?)`,
};
