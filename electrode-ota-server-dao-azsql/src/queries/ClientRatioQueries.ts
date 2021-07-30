export const ClientRatioQueries = {
    deleteClientRatioByPackageId : `DELETE FROM client_ratio WHERE package_id = ?`,

    getClientRatioByClientId : `SELECT client_unique_id, package_id, create_time, ratio, is_updated
                                FROM client_ratio
                                WHERE client_unique_id = ?
                                AND package_id = ?`,

    insertClientRatio : `INSERT INTO client_ratio
                        (client_unique_id, package_id, ratio, is_updated)
                        VALUES(?, ?, ?, ?)`,

    updateClientRatio : `UPDATE client_ratio
                        SET ratio = ?, is_updated = ?
                        WHERE client_unique_id = ?
                        AND package_id = ?`,
};
