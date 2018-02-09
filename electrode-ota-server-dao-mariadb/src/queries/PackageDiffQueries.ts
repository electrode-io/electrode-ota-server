export const PackageDiffQueries = {
    deletePackageDiff : `DELETE FROM package_diff
                        WHERE left_package_id = ?
                        AND right_package_id = ?`,

    deletePackageDiffByLeftPkgId : `DELETE FROM package_diff
                                    WHERE left_package_id = ?`,

    deletePackageDiffByRightPkgId : `DELETE FROM package_diff
                                    WHERE right_package_id = ?`,

    getPackageDiffsForLeftPkgId : `SELECT p.package_hash, pd.size, pd.url
                                    FROM package_diff pd, package p
                                    WHERE pd.right_package_id = p.id
                                    AND pd.left_package_id = ?`,

    insertPackageDiff : `INSERT INTO package_diff
                        (left_package_id, right_package_id, size, url)
                        VALUES(?, ?, ?, ?)`,
};
