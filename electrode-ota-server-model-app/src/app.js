import {id, key, toJSON} from 'electrode-ota-server-util';
import {isZip, generate} from 'electrode-ota-server-model-manifest/lib/manifest';
import {shasum} from 'electrode-ota-server-util';

import {
    alreadyExists,
    alreadyExistsMsg,
    notFound,
    missingParameter,
    notAuthorized,
    invalidRequest
} from 'electrode-ota-server-errors';

const excludeNull = obj => Object.keys(obj).reduce((ret, key) => {
    if (obj[key] == null) return ret;
    ret[key] = obj[key];
    return ret;
}, {});


export const Perms = {
    Owner: ['Owner'],
    Collaborator: ['Collaborator'],
    Any: ['Owner', 'Collaborator']
};
const toBuffer = (obj) => JSON.stringify(obj);

const hasDeploymentName = ({deployments}, deployment) => {
    if (!deployments)return false;
    if (Array.isArray(deployments)) {
        return deployments.indexOf(deployment) > -1;
    }
    return deployment in deployments;
};

const packageContainsChanges = (deploymentInDb, uploadedContent) => {
    if (deploymentInDb && deploymentInDb.package && deploymentInDb.package.packageHash) {
        let uploadedContentPackageHash = shasum(uploadedContent);
        return uploadedContentPackageHash !== deploymentInDb.package.packageHash;
    }
    return true;
};

const hasPerm = (app, email, perms = Perms.Any) => {
    missingParameter(app, 'app');
    missingParameter(email, 'email');
    const c = app.collaborators[email];
    return c && perms.indexOf(c.permission) > -1;
};

const _newDeployment = name => {
    return {
        "createdTime": Date.now(),
        name,
        "key": key(),
        "id": id(),
        "package": null
    }
};
const _addDeployment = (app, name) => {
    if (!app.deployments) {
        app.deployments = {};
    }
    return (app.deployments[name] = _newDeployment(name));
};

const notAuthorizedPerm = (app, email, perm, message) => {
    if (hasPerm(app, email, Perms[perm] || perm)) {
        return app;
    }
    return notAuthorized(false, message);
};

export default (options, dao, upload, download, logger) => {
    const api = {};
    return Object.assign(api, {
        findApp({email, app}){
            return dao.appForCollaborator(email, app).then(result => notFound(result, `App not found ${app}`)).then(toJSON);
        },
        _findApp(find, perm = 'Owner', errorMessage = `Do not have permission to do this operation.`){
            return api.findApp(find).then(app => notAuthorizedPerm(app, find.email, perm, errorMessage));
        },
        createApp({email, name, deployments = ["Production", "Staging"]}) {
            if (!name) {
                return Promise.reject(missingParameter(name, 'name'));
            }
            return dao.appForCollaborator(email, name).then(check => {
                alreadyExists(!check, name);

                const app = ({
                    name,
                    "collaborators": {
                        [email]: {
                            "permission": "Owner"
                        }
                    },
                    "deployments": {}
                });

                deployments.forEach((name) => app.deployments[name] = _addDeployment(app, name));
                return dao.createApp(app)
                    .tap((app) => logger.info({ name, appId : app.id }, "app created"));
            });
        },

        removeApp(find) {
            return api._findApp(find, 'Owner', 'Must be owner of app to remove')
                .then(app => dao.removeApp(app.id).then(v => app))
                    .tap(() => logger.info({ name, appId : app.id }, "app removed"));
        },

        renameApp(find){
            return api._findApp(find, 'Owner', 'Must be owner of app to rename').then(app => {
                const oldName = app.name;
                app.name = find.name;
                return dao.updateApp(app.id, app).then(v => app)
                    .tap(() => logger.info({ oldName, newName : app.name, appId : app.id }, "app renamed"));
            });
        },

        transferApp(find)
        {
            return api._findApp(find, 'Owner', 'Must be owner of app to transfer').then(app => dao.userByEmail(find.transfer).then(u => {
                notFound(u, `The specified e-mail address doesn't represent a registered user`);
                const owner = app.collaborators[find.email];
                const transfer = app.collaborators[find.transfer] || (app.collaborators[find.transfer] = {});
                owner.permission = 'Collaborator';
                transfer.permission = 'Owner';
                return dao.updateApp(app.id, app).then(toJSON)
                    .tap(() => logger.info({
                            id : app.id,
                            oldOwner : find.owner,
                            newOwner : find.transfer
                        }, "app transferred"));
            }));
        },

        listApps({email}){
            return dao.appsForCollaborator(email).then(toJSON)
                .tap(() => logger.info({ additional : { email }}, "got app list"));
        },

        listDeployments(find){
            return api.findApp(find).then(app => dao.deploymentsByApp(app.id, app.deployments)
                .then(deployments => {
                    logger.info({ appId : app.id }, "fetched deployments");
                    return app.deployments.map(name => deployments[name]);
                }));
        },

        async getDeployment(find){
            const app = await api.findApp(find);
            const deployment = await dao.deploymentByApp(app.id, find.deployment);
            logger.info({ appId : app.id, deployment : find.deployment }, "fetched deployment")
            return deployment;
        },

        removeDeployment(params){
            return api.findApp(params).then(app => {
                return dao.removeDeployment(app.id, params.deployment)
                    .tap(() => logger.info({ appId : app.id, deployment : params.deployment }, "removed deployment"));
            });
        },

        renameDeployment(params){
            return api.findApp(params).then(app => {
                const {deployment, name} = params;
                notFound(hasDeploymentName(app, deployment), `Deployment '${deployment}' not found ${params.app}`);
                alreadyExists(!hasDeploymentName(app, name), name, 'deployment');
                return dao.renameDeployment(app.id, deployment, name)
                    .tap(() => logger.info({ appId : app.id, oldName : deployment, newName : name }, "renamed deployment"));
            });
        },

        promoteDeployment(params)
        {
            return api.findApp(params).then(app => {

                return dao.deploymentsByApp(app.id, [params.deployment, params.to]).then(async (deployments) => {
                    const f = deployments[params.deployment];

                    notFound(f && f.package, `Deployment "${params.deployment}" does not exist.`);

                    const t = notFound(deployments[params.to], `Deployment "${params.to}" does not exist.`);

                    let pkg = f.package;

                    if (params.label) {
                        const packages = await dao.history(app.id, [params.deployment]);
                        pkg = packages.find((packag) => {
                            return packag.label === params.label;
                        });

                        notFound(pkg, `Deployment "${params.deployment}" has no package with label "${params.label}"`);
                    }

                    const existingPackage = t.package;
                    
                    // check to make sure that it is not already promoted
                    if (existingPackage) {
                        console.log("from packageHash", pkg.packageHash);
                        console.log("to packageHash", existingPackage.packageHash);
                        alreadyExistsMsg((existingPackage.packageHash !== pkg.packageHash), 
                            `Deployment ${params.from}:${pkg.label} has already been promoted to ${params.to}:${existingPackage.label}.`);
                    }

                    // rollout property should not be carried forward on promotion
                    const {
                        isDisabled = pkg.isDisabled,
                        isMandatory = pkg.isMandatory,
                        rollout, // = pkg.rollout,
                        appVersion = pkg.appVersion,
                        description = pkg.description,
                    } = excludeNull(params);

                    console.log("adding package");
                    return dao.addPackage(t.key, {
                        packageHash: pkg.packageHash,
                        isDisabled,
                        isMandatory,
                        rollout,
                        appVersion,
                        uploadTime: Date.now(),
                        description,
                        releasedBy: params.email,
                        releaseMethod: "Promote",
                        originalLabel: pkg.label,
                        originalDeployment: params.deployment,
                        blobUrl : pkg.blobUrl,
                        manifestBlobUrl : pkg.manifestBlobUrl,
                        size : pkg.size,
                        label : "v" + (t.history_ ? t.history_.length + 1 : 1)
                    }).tap(() => {
                        logger.info({
                                appId : app.id,
                                fromDeployment : params.deployment,
                                toDeployment : params.to,
                                originalLabel : pkg.label
                            }, "promoted deployment");
                    });
                });
            });
        },

        async historyDeployment({app, deployment, email})
        {
            const capp = await api.findApp({app, deployment, email});
            const all = await dao.history(capp.id, deployment);
            const map = all.map(toJSON);
            //TODO -make less worse.
            for (let i = map.length - 1; i >= 0; --i) {
                delete map[i].created_;
            }
            logger.info({ appId : capp.id, deployment : deployment }, "fetched deployment history");
            return map;
        },


        updateDeployment(params)
        {
            return api.findApp(params).then(app => dao.deploymentByApp(app.id, params.deployment).then(deployment => {
                notFound(deployment, `Deployment not found '${params.deployment}'`);
                notFound(deployment.package, `Deployment has no releases.`);

                const pkg = deployment.package;
                const {
                    isDisabled = pkg.isDisabled,
                    isMandatory = pkg.isMandatory,
                    rollout = pkg.rollout,
                    appVersion = pkg.appVersion,
                    description = pkg.description
                } = excludeNull(params);

                invalidRequest(!(params.rollout != null && (pkg.rollout != null && params.rollout < pkg.rollout)), `Can not set rollout below existing rollout ${pkg.rollout}`);

                const npkg = {
                    isDisabled,
                    isMandatory,
                    rollout,
                    appVersion,
                    description
                };

                return dao.updatePackage(deployment.key, npkg)
                    .tap(() => logger.info({ appId : app.id, deployment : params.deployment }, "updated deployment"));
            })).then(toJSON);
        },

        addDeployment({email, app, name})
        {
            return api._findApp({
                email,
                app
            }, 'Any', `Do not have permission to  add deployment to '${app}'.`).then(app => {

                alreadyExists(!hasDeploymentName(app, name), name, `deployment`);
                return dao.addDeployment(app.id, name, _newDeployment(name))
                    .tap(() => logger.info({ appId : app.id, deployment : name }, "added deployment"));
            });
        },

        removeCollaborator({email, app, collaborator})
        {
            return api._findApp({email, app}, 'Owner', `Must be owner to remove a collaborator`).then(app => {

                notAuthorized(app.collaborators[collaborator].permission !== 'Owner',
                    `Cannot remove the owner of the app from collaborator list.`);
                notFound((email in app.collaborators),
                    `The given account is not a collaborator for this app.`);

                delete app.collaborators[collaborator];
                return dao.updateApp(app.id, app)
                    .tap(() => logger.info({ appId : app.id, collaborator }, "removed collaborator"));
            });
        },


        addCollaborator({email, app, collaborator})
        {
            return api._findApp({email, app}, 'Owner', `Must be owner to add collaborator`).then(app => {
                alreadyExistsMsg(!(collaborator in app.collaborators), `The given account is already a collaborator for this app.`);


                return dao.userByEmail(collaborator).then(a => {

                    notFound(a, `The specified e-mail address doesn't represent a registered user`);

                    app.collaborators[collaborator] = {
                        "permission": "Collaborator"
                    };
                    return dao.updateApp(app.id, app).then(v => true)
                        .tap(() => logger.info({ appId : app.id, collaborator }, "added collaborator"));
                });
            });
        },


        /**
         * {
	"package": {
		"description": "",
		"isDisabled": false,
		"isMandatory": false,
		"rollout": 100,
		"appVersion": "1",
		"packageHash": "3c6ebf5bae90813ba7db2a475d2a73ced0535f60e69b47f3bf81dd00361653d1",
		"blobUrl": "https://codepush.blob.core.windows.net/storagev2/GS7OibP4VaS001t2O0GWsMXC0bQp4yecGHaB-",
		"size": 6126,
		"releaseMethod": "Upload",
		"uploadTime": 1468962405823,
		"label": "v1",
		"releasedBy": "speajus@gmail.com"
	}
}
         * param app
         * param email
         * param deployment
         * param package
         * param packageInfo
         */

        upload(vals){
            const {
                app,
                email,
                deployment = 'Staging',
                downloadUrl = '',
                packageInfo: {
                    description = '',
                    isDisabled = false, label, isMandatory = false, rollout = 100, appVersion = '1.0.0'
                }
            } = vals;

            return api.findApp({email, app}).then(_app => {

                notFound(hasDeploymentName(_app, deployment), `Not a valid deployment '${deployment}' for app '${app}'`);
                const zip = isZip('', vals.package);

                return dao.deploymentByApp(_app.id, deployment).then(deployments => {

                    alreadyExistsMsg(packageContainsChanges(deployments, vals.package), 'No changes detected in uploaded content for this deployment.');

                    //noinspection JSUnresolvedVariable
                    const pkg = {
                        description, isDisabled, isMandatory, rollout, appVersion,
                        releaseMethod: "Upload",
                        uploadTime: Date.now(),
                        label: label || "v" + (deployments.history_ ? deployments.history_.length + 1 : 1),
                        releasedBy: email
                    };

                    return upload(vals.package)
                        .then((resp) => {
                            if (zip) {
                                return generate(vals.package).then(toBuffer).then(upload)
                                    .then(({blobUrl}) => {
                                        resp.manifestBlobUrl = blobUrl;
                                        return resp;
                                    });
                            }
                            return resp;
                        })
                        .then(resp => {
                            return dao.addPackage(deployments.key, Object.assign({}, pkg, resp))
                                .tap(() => {
                                    logger.info({
                                            appId : app.id,
                                            deployment,
                                            releasedBy : email,
                                            label : pkg.label,
                                            appVersion,
                                        }, "package uploaded")
                                });
                        });
                });
            })
        },

        clearHistory(params){
            return api._findApp(params, 'Owner', `Must be owner to clear history`)
                .then(app => {
                    return dao.clearHistory(app.id, params.deployment)
                        .tap(() => logger.info({ appId : app.id, deployment : params.deployment }, "history cleared"));
                });
        },


        metrics(params)
        {
            return api.findApp(params).then(app => {

                notFound(hasDeploymentName(app, params.deployment), params.deployment, 'deployment');
                return dao.deploymentByApp(app.id, params.deployment).then((deployment) => dao.metrics(deployment.key).then((metrics = []) => {

                    const {label} = deployment.package || {};
                    //    "DeploymentSucceeded" |  "DeploymentFailed" |  "Downloaded";

                    logger.info({ deployment : params.deployment }, 'fetched metrics');

                    return metrics.reduce((obj, val) => {
                        const key = val.label || val.appversion;
                        const ret = obj[key] || (obj[key] = {
                                active: 0,
                                downloaded: 0,
                                installed: 0,
                                failed: 0
                            });
                        switch (val.status) {
                            case 'DeploymentSucceeded':
                                ret.active++;
                                if (label === val.label) {
                                    //pervious deployment is no longer active.
                                    /*                                    obj[val.previouslabelorappversion] || (obj[val.previouslabelorappversion] = {
                                     active: 0,
                                     downloaded: 0,
                                     installed: 0,
                                     failed: 0
                                     });*/
                                    if (obj[val.previouslabelorappversion])
                                        obj[val.previouslabelorappversion].active--;
                                }
                                ret.installed++;
                                break;
                            case 'DeploymentFailed':
                                ret.failed++;
                                break;
                            case 'Downloaded':
                                ret.downloaded++;
                                break;

                        }
                        return obj;
                    }, {});
                }));
            });
        },

        rollback(params)
        {
            let appId = null;
            return api.findApp(params).then(app => {
                appId = app.id;
                if (params.label) {
                    return dao.historyLabel(app.id, params.deployment, params.label).then(rollto => dao.deploymentByApp(app.id, params.deployment).then(deployment => ({
                        rollto,
                        deployment
                    })));
                } else {
                    return dao.deploymentByApp(app.id, params.deployment)
                        .then(deployment => deployment.history_ && dao.packageById(deployment.history_[1]).then(rollto => ({
                            deployment,
                            rollto
                        })));
                }
            }).then(({rollto, deployment}) => {
                notFound(rollto, `Cannot perform rollback because there are no releases on this deployment.`);
                const {history_} = deployment;
                const dpkg = deployment.package;
                const pkg = Object.assign({}, rollto, {
                    uploadTime: Date.now(),
                    rollout: 100,
                    releasedBy: params.email,
                    releaseMethod: "Rollback",
                    originalLabel: rollto.label,
                    label: `v${history_.length + 1}`
                });
                return dao.addPackage(deployment.key, pkg).then(v => pkg)
                    .tap(() => logger.info({ appId, deployment : params.deployment, originalLabel : rollto.label }, 'rolled back package'));
            });

        }
    });

};

