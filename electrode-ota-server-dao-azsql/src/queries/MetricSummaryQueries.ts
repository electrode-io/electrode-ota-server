export const MetricSummaryQueries = {
  getSummaryByDeploymentId: `SELECT * FROM metrics_summary WHERE deployment_id = ?`,
  updateSummaryById: `UPDATE metrics_summary SET lock_by=?, lock_time=?, last_run_time=?, summary_json=? WHERE id = ?`,
  insertSummary: `INSERT metrics_summary (deployment_id, lock_by, lock_time, last_run_time, summary_json) VALUES (?, ?, ?, ?, ?)`
};
