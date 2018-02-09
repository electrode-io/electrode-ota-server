export const PackageTagQueries = {
    deletePackageTag : `DELETE FROM package_tag
                        WHERE package_id = ?
                        AND tag_name = ?`,

    deletePackageTagsByPackageId : "DELETE FROM package_tag WHERE package_id = ?",

    insertPackageTag : `INSERT INTO package_tag
                        (package_id, tag_name)
                        VALUES(?, ?)`,

    getTagsForPackage : `SELECT id, tag_name, package_id, create_time
                                    FROM package_tag
                                    WHERE package_id = ?`,

    getMatchingTagsForPackage : `SELECT id, tag_name, package_id, create_time
                                 FROM package_tag
                                 WHERE package_id = ?
                                 AND tag_name IN (?)`                                   
};
