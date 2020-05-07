export const PackageQueries = {
    deletePackage : `DELETE FROM package WHERE id = ?`,

    getPackageByHash : `SELECT id, app_version, blob_url,
                        create_time, description, is_disabled,
                        is_mandatory, label, manifest_blob_url,
                        original_deployment_name, original_label, package_hash,
                        release_method, released_by, rollout,
                        size, upload_time
                        FROM package
                        WHERE package_hash = ?`,

    getPackageById : `SELECT id, app_version, blob_url,
                        create_time, description, is_disabled,
                        is_mandatory, label, manifest_blob_url,
                        original_deployment_name, original_label, package_hash,
                        release_method, released_by, rollout,
                        size, upload_time
                        FROM package
                        WHERE id = ?`,

    getMostRecentPackageIdByDeploymentAndTags : `SELECT dph.package_id, p.create_time, p.app_version
                                    FROM deployment_package_history dph, package_tag pt, package p
                                    WHERE dph.deployment_id = ?
                                    AND p.id = dph.package_id
                                    AND dph.package_id = pt.package_id
                                    AND pt.tag_name IN (?)

                                    UNION

                                    SELECT dph.package_id, p.create_time, p.app_version
                                    FROM deployment_package_history dph, package p
                                    WHERE dph.deployment_id = ?
                                    AND dph.package_id = p.id
                                    AND NOT EXISTS
                                    (SELECT 1
                                    FROM package_tag pt
                                    WHERE dph.package_id = pt.package_id)

                                    ORDER BY 2 DESC`,
    getMostRecentPackageIdByDeploymentAndTagsAndVersion : `SELECT dph.package_id, p.create_time
                                    FROM deployment_package_history dph, package_tag pt, package p
                                    WHERE dph.deployment_id = ?
                                    AND p.id = dph.package_id
                                    AND p.app_version = ?
                                    AND dph.package_id = pt.package_id
                                    AND pt.tag_name IN (?)

                                    UNION

                                    SELECT dph.package_id, p.create_time
                                    FROM deployment_package_history dph, package p
                                    WHERE dph.deployment_id = ?
                                    AND dph.package_id = p.id
                                    AND p.app_version = ?
                                    AND NOT EXISTS
                                    (SELECT 1
                                    FROM package_tag pt
                                    WHERE dph.package_id = pt.package_id)

                                    ORDER BY 2 DESC`,
    getMostRecentPackageIdByDeploymentNoTags : `SELECT dph.package_id, p.create_time
                                                FROM deployment_package_history dph, package p
                                                WHERE dph.deployment_id = ?
                                                AND dph.package_id = p.id
                                                AND NOT EXISTS
                                                (SELECT 1
                                                FROM package_tag pt
                                                WHERE dph.package_id = pt.package_id)

                                                ORDER BY 2 DESC`,
    getMostRecentPackageIdByDeploymentNoTagsAndVersion : `SELECT dph.package_id, p.create_time
                                                FROM deployment_package_history dph, package p
                                                WHERE dph.deployment_id = ?
                                                AND dph.package_id = p.id
                                                AND p.app_version = ?
                                                AND NOT EXISTS
                                                (SELECT 1
                                                FROM package_tag pt
                                                WHERE dph.package_id = pt.package_id)

                                                ORDER BY 2 DESC`,

    insertPackage : `INSERT INTO package
                    (app_version, blob_url, description,
                    is_disabled, is_mandatory, label,
                    manifest_blob_url, original_deployment_name, original_label,
                    package_hash, release_method, released_by,
                    rollout, size)
                    VALUES(?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?)`,

    updatePackage : `UPDATE package
                    SET is_disabled = ?,
                    is_mandatory = ?,
                    rollout = ?,
                    app_version = ?,
                    description = ?,
                    update_time = CURRENT_TIMESTAMP(3)
                    WHERE id = ?`,

    updatePackageTime : `UPDATE package SET update_time = CURRENT_TIMESTAMP(3) WHERE id = ?`,

    getMostRecentPackageIdByDeployment : `SELECT dph.package_id, p.create_time, p.app_version
                                                FROM deployment_package_history dph, package p
                                                WHERE dph.deployment_id = ?
                                                AND dph.package_id = p.id
                                                AND NOT EXISTS
                                                (SELECT 1
                                                FROM package_tag pt
                                                WHERE dph.package_id = pt.package_id)
                                                ORDER BY 2 DESC`,
};
