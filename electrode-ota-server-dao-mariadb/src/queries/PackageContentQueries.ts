export const PackageContentQueries = {
    deletePackageContentByPkgId : `DELETE FROM package_content 
                                    WHERE package_hash = (SELECT package_hash FROM package WHERE id = ?)`,

    getPackageContentByPkgHash : `SELECT package_hash, content
                                FROM package_content
                                WHERE package_hash = ?`,

    insertPackageContent : `INSERT INTO package_content
                            (package_hash, content)
                            VALUES(?, ?) ON DUPLICATE KEY UPDATE package_hash = package_hash`,
};
