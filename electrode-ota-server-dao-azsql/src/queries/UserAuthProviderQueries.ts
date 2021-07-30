export const UserAuthProviderQueries = {
    getAuthProvidersForUserId : `SELECT provider
                                FROM user_auth_provider
                                WHERE user_id = ?`,
    insertAuthProvider : `INSERT INTO user_auth_provider
                            (user_id, provider)
                            VALUES(?, ?)`,
};
