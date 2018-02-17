export const MetricQueries = {
    getMetricsForDeployment : `SELECT deployment_id, app_version, client_unique_id, label,
                                previous_deployment_key, previous_label_or_app_version, status
                                FROM metric
                                WHERE deployment_id = ?`,

    insertMetric : `INSERT INTO metric
                    (deployment_id, app_version, client_unique_id, label,
                    previous_deployment_key, previous_label_or_app_version, status)
                    VALUES(?, ?, ?, ?,
                    ?, ?, ?)`,
};
