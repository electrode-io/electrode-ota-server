import {missingParameter} from './errors';
import version from 'semver';
const fixver = (ver)=>ver ? ('' + ver).replace(/^(\d+?)$/, '$1.0.0') : '0.0.0';

export default (dao, weighted, _download, manifest)=> {
    const api = {
        download(hash){
            return _download(hash);
        },

        /**
         *  https://codepush.azurewebsites.net/updateCheck?deploymentKey=5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-&appVersion=1.2.3&packageHash=b10064ba007b3857655726404972980f963879fa4fe196b1ef9d06ae6d3891d5&isCompanion=&label=&clientUniqueId=4B4CBBF7-7F0A-4D34-BD9A-984FD190766D
         * param deploymentKey
         * param appVersion
         * param packageHash
         * param isCompanion
         * param label
         * param clientUniqueId
         */
        updateCheck(params)
        {

            missingParameter(params.deploymentKey, `Deployment key missing`);
            missingParameter(params.appVersion, `appVersion missing`);

            return dao.deploymentForKey(params.deploymentKey).then(deployment=> {
                const pkg = deployment && deployment.package;
                if (!pkg) {
                    /**
                     * If no packages have been published just return this.
                     */
                    return {
                        isAvailable: false,
                        shouldRunBinaryVersion: false
                    }
                }

                let isNotAvailable = pkg.packageHash == params.packageHash || !('clientUniqueId' in params);

                const appVersion = fixver(pkg.appVersion);

                function makeReturn(isAvailable) {
                    const packageSize = pkg && pkg.size && (pkg.size - 0) || 0;
                    const ret = {
                        downloadURL: pkg.blobUrl,
                        isAvailable,
                        isMandatory: pkg.isMandatory,
                        appVersion,
                        label: pkg.label,
                        packageSize,
                        packageHash: pkg.packageHash,
                        description: pkg.description,
                        "updateAppVersion": version.lt(fixver(params.appVersion), appVersion),
                        //TODO - find out what this should be
                        "shouldRunBinaryVersion": false
                    };
                    if (isAvailable) {
                        if (pkg.manifestBlobUrl) {
                            const diffPackageMap = pkg.diffPackageMap || {};
                            const partial = diffPackageMap[params.packageHash];
                            if (partial) {
                                ret.downloadURL = partial.url;
                                ret.packageSize = partial.size;
                                return ret;
                            } else {
                                return dao.historyByIds(deployment.history_)
                                    .then(history=>history.filter(v=>v.packageHash == params.packageHash))
                                    .then(matches=> manifest(matches.concat(pkg)).then(v=> {
                                        return dao.updatePackage(deployment.key, v[v.length-1]).then((pkgLast)=> {
                                            const p2 = pkgLast.diffPackageMap && pkgLast.diffPackageMap[params.packageHash];
                                            if (p2) {
                                                ret.downloadURL = p2.url;
                                                ret.packageSize = p2.size;
                                            }
                                            return ret;
                                        })
                                    }));

                            }
                        }
                    }

                    return ret;
                }

                return isNotAvailable ? makeReturn(isNotAvailable) : api.isUpdateAble(params.clientUniqueId, pkg.packageHash, pkg.rollout).then(makeReturn);

            });
        },
        downloadReportStatus(/*{
                              clientUniqueId,
                              deploymentKey,
                              label
                              }*/ metric)
        {
            metric.status = 'Downloaded';
            return dao.insertMetric(metric);
        }
        ,
        /**
         * {
	"appVersion": "1.0.0",
	"deploymentKey": "5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-",
	"clientUniqueId": "fe231438a4f62c70",
	"label": "v1",
	"status": "DeploymentSucceeded",
	"previousLabelOrAppVersion": "1.0.0",
	"previousDeploymentKey": "5UfjnOxv1FnCJ_DwPqMWQYSVlp0H4yecGHaB-"
}
         respoonse 204
         */
        deployReportStatus(/*{
                            appVersion,
                            deploymentKey,
                            clientUniqueId,
                            label,
                            status,
                            previousLabelOrAppVersion,
                            previousDeploymentKey
                            }*/ metric){
            return dao.insertMetric(metric);
        },
        /**
         * So this keeps track of what the client got last time.
         * Any time a ratio or a packageHash changes we roll the dice,
         * as to weather they will be updated.  If the ratio has not
         * changed nor the packageHash or the uniqueClientId then return
         * the last roll of the die.
         * Otherwise roll the die and save the results so if we get asked again...
         *
         * @param uniqueClientId
         * @param packageHash
         * @param ratio
         * @returns {*}
         */
        isUpdateAble(uniqueClientId, packageHash, ratio){
            //ratio 0 means no deployment.
            if (ratio == 0) {
                return Promise.resolve(false);
            }
            //ratio null well shouldn't be so we'll do true.
            if (ratio == 100 || ratio == null) {
                return Promise.resolve(true);
            }

            return dao.clientRatio(uniqueClientId, packageHash).then(resp=> {
                //if the ratio is the same just return the last decision;
                if (resp && resp.ratio == ratio) {
                    return resp.updated;
                }
                const updated = weighted(ratio);
                return dao.insertClientRatio(uniqueClientId, packageHash, ratio, updated).then(_=>updated);
            });
        }
    };
    return api;
};
