"use strict";
const {types} = require('dse-driver');
const {promiseMap, reducer, remove} = require('../../util');
const historySort = history => history && history.sort((a, b) => b.created_.getTime() - a.created_.getTime())
const {alreadyExistsMsg} = require('../../service/errors');
const UDTS = require('./models/UDTS');
const removeCreated = v => {
    return v && v.map(b => {
            const {created_, ...rest} = b.toJSON ? b.toJSON() : b;
            return rest;
        });
};
const toLowerCaseKeys = (obj) => {
    if (!obj) return obj;
    const ret = {};
    for (const key of Object.keys(obj)) {
        ret[key.toLowerCase()] = obj[key];
    }
    return ret;
};
const ACCESSKEY = Object.keys(UDTS.accesskey);
const asKeyAll = (v, arr = []) => {
    v = Array.isArray(v) ? v : [v];
    for (const _v of v)
        _v.key && arr.push(_v.key);
    return arr;
};

const historyAll = (v, arr = []) => {
    v = Array.isArray(v) ? v : [v];
    for (const _v of v)
        _v.history_ && arr.push(..._v.history_);
    return arr;
};
const updater = (fields, obj) => {
    if (!obj) return {};
    const ret = {};
    for (const key of fields) {
        if (obj.hasOwnProperty(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
};
const PACKAGE_FIELDS = [
    "appVersion",
    "blobUrl",
    "description",
    "rollout",
    "size",
    "uploadTime",
    "releaseMethod",
    "originalLabel",
    "originalDeployment",
    "label",
    "releasedBy",
    "diffPackageMap",
    "isDisabled",
    "manifestBlobUrl",
    "packageHash",
    "isMandatory"];

const PACKAGE_UPDATE_FIELDS = [
    "appVersion",
    "description",
    "isMandatory",
    "isDisabled",
    "rollout",
    "label",
    "diffPackageMap"
];


const BATCH = {return_query: true};
const nullUnlessValue = (obj, keys) => {
    for (const key of keys) {
        if (obj[key] === void(0)) {
            obj[key] = null;
        }
    }
};
const notimplement = () => {
    throw new Error(`Method is not implemented`);
};
const isEmpty = (arr) => {
    if (arr == null) return true;
    if (arr.length === 0) return true;
    return false;
};
const isNotEmpty = (arr) => !isEmpty(arr);
const apply = (target, source) => {
    if (!source) {
        return target;
    }
    for (const key of Object.keys(target)) {
        if (key == '_validators') continue;
        if (source.hasOwnProperty(key)) {
            const newValue = source[key];
            target[key] = newValue;
        }
    }
    return target;
};
const within = (arr) => {
    if (isEmpty(arr)) {
        throw new Error(`Can not look within an empty array!`);
    }
    if (arr.length === 1) {
        return arr[0];
    }
    return {
        $in: arr
    }
};

const Mock = {
    updateAsync: notimplement,
    update: notimplement,
    delete: notimplement,
    deleteAsync: notimplement,
    findOneAsync: notimplement,
    findAsync: notimplement,
};

const ifExists = (result) => {
    return result.rows && result.rows[0]['[applied]'] != false;
};

class DaoExpressCassandra {
    //these are just here for autocomplete.
    App = Mock;
    ClientRatio = Mock;
    DeploymentAppName = Mock;
    Deployment = Mock;
    Metric = Mock;
    PackageContent = Mock;
    Package = Mock;
    User = Mock;

    constructor({client}) {
        Object.assign(this, client.instance);
        this._models = client;
    }

    newApp(app) {
        app.id = this._models.uuid();
        return new this.App(app);
    }

    newClientRatio(ratio) {
        return new this.ClientRatio(ratio);
    }

    newDeploymentAppName(dan) {
        return new this.DeploymentAppName(dan);
    }

    newDeployment(dep) {
        dep.id = this._models.uuid();
        return new this.Deployment(dep);
    }

    newMetric(metric) {
        return new this.Metric(toLowerCaseKeys(metric));
    }

    newPackageContent(content) {
        return new this.PackageContent(content);
    }

    newPackage(pkg) {
        pkg.id_ = this._models.uuid();
        pkg.created_ = Date.now();
        if (pkg.size)
            pkg.size = types.Integer.fromNumber(pkg.size);

        return new this.Package(pkg);
    }

    newUser(user) {
        user.id = this._models.uuid();
        return new this.User(user);
    }


    async createUser({email, name, accessKeys, linkedProviders = ['GitHub']}) {
        const user = this.newUser({email, name, accessKeys, linkedProviders});
        const result = await user.saveAsync({if_not_exist: true});
        alreadyExistsMsg(ifExists(result), `User already exists ${email}`)

        return user;
    }

    async createApp({name, deployments = {}, collaborators}) {
        const deps = Object.keys(deployments);

        const app = this.newApp({name, collaborators});
        await app.saveAsync();
        if (isNotEmpty(deps)) {
            for (const name of deps) {
                await this.addDeployment(app.id, name, deployments[name]);
            }
        }
        app.deployments = deps;
        return app;
    }

    async updateApp(id, {name, collaborators}) {
        const app = await this.App.findOneAsync({id});
        app.name = name;
        app.collaborators = collaborators;
        await app.saveAsync();
        return app;
    }

    async _deploymentsByAppId(appId) {
        const app = await this.App.findOneAsync({id: appId});
        return app.deployments;
    }

    async _deploymentKeyByAppAndName(app, name) {
        const dan = await this.DeploymentAppName.findOneAsync({app: app, name});
        if (!dan) {
            console.log(`Could not find ${app} ${name}`);
            throw new Error(`No app found for id ${app} and ${name}`);
        }
        return dan.key;
    }

    async _deploymentByAppAndName(appId, deploymentName) {
        const key = await this._deploymentKeyByAppAndName(appId, deploymentName);
        return this.Deployment.findOneAsync({key});
        /*        return this._deploymentKeyByAppAndName(appId, deploymentName)
         .then(key=>this._first(`SELECT * FROM deployments WHERE key = ?`, [key]));*/
    }

    async addDeployment(app, name, {key}) {
        let deployments = await this._deploymentsByAppId(app);
        if (deployments == null) {
            deployments = [name];
        } else {
            deployments = deployments.concat(name);
        }
        return this._batch(
            this.newDeployment({name, key}).save(BATCH),
            this.newDeploymentAppName({key, app, name}).save(BATCH),
            this.App.update({id: app}, {deployments}, BATCH)
        );
        /*
         .then(deployments => this._batch([
         q(`INSERT INTO deployments ("createdTime", id, name, key) VALUES ( toUnixTimestamp(now()),  now(), ?, ?)`, name, key),
         q(`INSERT INTO deployments_app_name (key, app, name) VALUES (?, ? , ?)`, key, appId, name),
         q(`UPDATE apps SET deployments = ? WHERE id = ?`, deployments ? deployments.concat(name) : [name], appId)
         ]));*/

    }


    async removeDeployment(appId, deploymentName) {
        const dep = await this._deploymentsByAppId(appId);
        const key = await this._deploymentKeyByAppAndName(appId, deploymentName);
        const history_ = await this._historyForDeployment(key);
        const deployments = remove(dep, deploymentName);
        return this._batch(
            this.DeploymentAppName.delete({app: appId, name: deploymentName}, BATCH),
            this.App.update({id: appId}, {deployments}, BATCH),
            this.Deployment.delete({key}, BATCH),
            isNotEmpty(history_) && this.Package.delete({id_: within(history_)}, BATCH)
        );

        /*  return this._deploymentsByAppId(appId)
         .then((dep) => this._deploymentKeyByAppAndName(appId, deploymentName)
         .then(key => this._first(`SELECT key, history_ FROM deployments WHERE key = ?`, [key]))
         .then(({key, history_}) => {
         const batch = [
         q(`DELETE FROM deployments_app_name WHERE app = ? AND name = ?`, appId, deploymentName),
         q(`UPDATE apps SET deployments =  ? WHERE id = ?`, remove(dep, deploymentName), appId),
         q(`DELETE FROM deployments WHERE key = ?`, key),
         ];
         if (history_ && history_.length) {
         batch.push(q(`DELETE FROM packages WHERE id_ in ?`, history_ || []));
         }
         return this._batch(batch)
         }));*/
    }

    _batch(...queries) {
        const execute = queries.filter(Boolean);
        return this._models.doBatchAsync(execute);
    }

    async renameDeployment(appId, oname, nname) {
        if (oname == nname)
            throw new Error(`Can not rename to the same name.`);

        const deps = await this._deploymentsByAppId(appId);
        const key = await this._deploymentKeyByAppAndName(appId, oname);

        return this._batch(
            this.DeploymentAppName.delete({app: appId, name: oname}, BATCH),
            (this.newDeploymentAppName({key, app: appId, name: nname}).save(BATCH)),
            this.App.update({id: appId}, {deployments: remove(deps, oname).concat(nname)}, BATCH),
            this.Deployment.update({key}, {name: nname}, BATCH)
        );
        /*
         *       return this._deploymentsByAppId(appId)
         *           .then(deps => this._deploymentKeyByAppAndName(appId, oname)
         *               .then(key => this._batch([
         *                   q(`DELETE FROM deployments_app_name WHERE app = ? AND name = ?`, appId, oname),
         *                   q(`INSERT INTO deployments_app_name (key, app, name) VALUES (?,?,?)`, key, appId, nname),
         *                   q(`UPDATE apps SET deployments = ? WHERE id = ?`, remove(deps, oname).concat(nname), appId),
         *                   q(`UPDATE deployments SET name = ? WHERE key = ?`, nname, key)
         *               ])));
         */
    }

    async _historyForDeployment(key) {
        const res = await this.Deployment.findOneAsync({key});
        return res.history_;
    }

    async addPackage(deploymentKey, value) {

        let history_ = await this._historyForDeployment(deploymentKey);
        const pkg = this.newPackage(value);
        const res = await pkg.saveAsync({if_not_exist: true});

        if (isEmpty(history_)) {
            history_ = [pkg.id_];
        } else {
            history_ = [pkg.id_, ...history_];
        }
        await this.Deployment.updateAsync({key: deploymentKey}, {history_});
        pkg.history_ = history_;
        return pkg;
        /**        return this._first(`SELECT history_ FROM deployments WHERE key = ?`, [deploymentKey], v => v ? v.history_ : [])
         *           .then(history => {
         *               const pkgId = tuuid();
         *
         *       //add pkgId first.
         *        if (history) {
         *            history.unshift(pkgId);
         *        } else {
         *            history = [pkgId]
         *        }
         *        return this._batch([
         *            q(`UPDATE deployments SET history_ = ?  WHERE key = ?`, history, deploymentKey),
         *            q(`UPDATE packages SET created_ = toUnixTimestamp(now()), ${update} WHERE "id_" = ?`, ...params, pkgId)
         *        ]).then(_ => this._first(`SELECT * FROM packages WHERE id_ = ?`, [pkgId]));
         *    });
         */
    }

    async  updatePackage(deploymentKey, pkg, label) {
        const history_ = await this._historyForDeployment(deploymentKey);
        if (isEmpty(history_)) {
            throw new Error(`Can not update a package without history, probably means things have gone awry.`);
        }
        let rpkg;

        if (label) {
            rpkg = await this.Package.findOneAsync({id_: within(history_), label});
        } else {
            rpkg = await this.Package.findOneAsync({id_: within(history_)});
        }
        apply(rpkg, pkg);
        await rpkg.saveAsync();
        return rpkg;
        /*
         *       return this._first(`SELECT history_ FROM deployments WHERE key = ? `, [deploymentKey], v => v.history_ || []).then((ids) => {
         *
         *           if (label) {
         *               const qp = [...params, ids, label];
         *               return this._first(`UPDATE packages SET ${update} WHERE "id_" in ? AND label = ?`, qp)
         *                   .then(_ => this._first(`SELECT * FROM packages WHERE id_ in ? AND label = ?`, qp));
         *           } else {
         *               const qp = [...params, ids[0]];
         *               return this._first(`UPDATE packages SET  ${update} WHERE "id_" = ?`, qp)
         *                   .then(_ => this._first(`SELECT * FROM packages WHERE id_ = ?`, [ids[0]]));
         *           }
         *       });
         */
    }


    async updateUser(currentEmail, update) {
        const user = await this.userByEmail(currentEmail);
        apply(user, update);
        await user.saveAsync();
        const js = user.toJSON();

        for (const key of Object.keys(js.accessKeys)) {
            nullUnlessValue(js.accessKeys[key], ACCESSKEY);
        }
        return js;
        /**
         * return this._first(`UPDATE users SET name=?, "accessKeys"=?, "linkedProviders"=? WHERE email= ?`, [name, accessKeys, linkedProviders, currentEmail])
         *   .then(_ => this.userByEmail(email));
         **/
    }

    async history(appId, deploymentName) {
        const deployment = await this._deploymentByAppAndName(appId, deploymentName);
        if (!deployment.history_) {
            return [];
        }
        const pkgs = await this.Package.findAsync({id_: within(deployment.history_)});

        const sort = historySort(pkgs);
        return sort;
        /*        return this._deploymentByAppAndName(appId, deploymentName)
         *           .then(deployment => deployment.history_ ? this._all(`SELECT * FROM packages WHERE id_ IN ?`, [deployment.history_]).then(historySort).then(removeCreated) : []);
         */
    }

    historyByIds(historyIds) {
        if (historyIds == null || historyIds.length == 0) {
            return [];
        }
        return this.Package.findAsync({id_: within(historyIds)});
//        return this._all(`SELECT * FROM packages WHERE id_ IN ?`, [historyIds]);
    }

    /**
     * Keep the actual history so that the label can update correctly.
     * @param appId
     * @param deploymentName
     * @returns {*|Promise|Promise.<Array>}
     */
    async clearHistory(appId, deploymentName) {
        const deployment = await this._deploymentByAppAndName(appId, deploymentName);
        if (deployment && isNotEmpty(deployment.history_)) {
            return this.Package.delete({id_: within(deployment.history_)});
        }
        /*        return this._deploymentByAppAndName(appId, deploymentName)
         .then(deployment => deployment.history_ ? this._first(`DELETE FROM packages WHERE id_ in ?`, [deployment.history_]) : []);*/

    }

    async historyLabel(appId, deploymentName, label) {
        /**
         * Because we can' use in query....
         */
        const deployment = await this._deploymentByAppAndName(appId, deploymentName);
        if (isEmpty(deployment.history_)) {
            return;
        }
        const pkgs = await this.Package.findAsync({id_: within(deployment.history_)});
        if (isNotEmpty(pkgs)) {
            for (const pkg of pkgs) {
                if (pkg.label === label) {
                    return pkg;
                }
            }
        }
        /*        return this._deploymentByAppAndName(appId, deploymentName)
         .then(deployment => deployment.history_ && this._all(`SELECT * FROM packages WHERE id_ IN ?`, [deployment.history_]).then(pkgs => pkgs && pkgs.find(v => v.label == label)));
         */
    }

    async packageById(pkg) {
        if (!pkg) return;
        return this.Package.findOneAsync({id_: pkg});
//        return this._first(`SELECT * FROM packages WHERE id_ = ?`, [pkg]);
    }

    async removeApp(appId) {
        const depAppName = await this.DeploymentAppName.findAsync({app: appId});
        if (isEmpty(depAppName)) return;
        const keys = asKeyAll(depAppName);
        const deps = await this.Deployment.findAsync({key: within(keys)});
        if (isEmpty(deps)) return;

        const packages = historyAll(deps);

        return this._batch(
            this.DeploymentAppName.delete({app: appId}, BATCH),
            this.App.delete({id: appId}, BATCH),
            isNotEmpty(packages) && this.Package.delete({id_: within(packages)}, BATCH),
            isNotEmpty(keys) && this.Deployment.delete({key: within(keys)}, BATCH)
        );
        /*      return this._all(`SELECT key FROM deployments_app_name  WHERE app = ?`, [appId], asKeyAll)
         *         .then(keys => {
         *             return this._all(`SELECT history_ FROM deployments WHERE key IN  ?`, [keys], historyAll)
         *                 .then(packages => {
         *                     const batch = [
         *                         q(`DELETE FROM deployments_app_name WHERE app = ?`, appId),
         *                         q(`DELETE FROM apps WHERE id = ?`, appId)
         *                     ];

         *                        if (packages && packages.length) {
         *                         batch.push(q(`DELETE FROM packages WHERE id_ IN ?`, packages));
         *                     }

         *                        if (keys && keys.length) {
         *                         batch.unshift(q(`DELETE FROM deployments WHERE key IN ?`, keys));
         *                     }
         *                     return this._batch(batch);
         *                 })
         *         });*/
    }

    userByAccessKey(accessKey) {
        return this.User.findOneAsync({accessKeys: {$contains_key: accessKey}});
        //        return this._first(`SELECT * FROM users WHERE "accessKeys" CONTAINS KEY ?`, [accessKey]);
    }


    userById(id) {
        return this.User.findOneAsync({id});
        //        return this._first(`SELECT * FROM users WHERE id = ?`, [id]);
    }

    async userByEmail(email) {
        return this.User.findOneAsync({email});

//        return this._first(`SELECT * FROM users WHERE email = ?`, [email]);
    }

    appById(id) {
        return this.App.findOneAsync({id});
//        return this._first(`SELECT * FROM apps WHERE id = ?`, [id]);
    }

    async upload(packageHash, content) {
        if (!Buffer.isBuffer(content)) {
            content = Buffer.from(content, 'utf8')
        }
        const pkg = this.newPackageContent({packageHash, content});
        const result = await pkg.saveAsync({if_not_exist: true});
        return ifExists(result);
//        return this._first(`INSERT INTO packages_content ("packageHash", content) VALUES(?,?) IF NOT EXISTS`, [packageHash, content]).then(insertError)
    }

    async download(packageHash) {
        const pkg = await this.PackageContent.findOneAsync({packageHash});
        if (pkg != null)
            return pkg.content;
        //return this._first(`SELECT content FROM packages_content WHERE "packageHash" = ? `, [packageHash]).then(v => v.content);
    }

    async  deploymentForKey(deploymentKey) {
        let dep = await this.Deployment.findOneAsync({key: deploymentKey});

        if (dep && isNotEmpty(dep.history_)) {
            dep = dep.toJSON();
            dep.package = await this.Package.findOneAsync({id_: dep.history_[0]});
            return dep;
        }
        return dep;
        /**   return this._first(`SELECT * FROM deployments WHERE key = ?`, [deploymentKey])
         *     .then(dep => dep && dep.history_ ? this._first(`SELECT * FROM packages WHERE id_ = ?`, [dep.history_[0]])
         *         .then(pkg => {
         *             dep.package = pkg;
         *             return dep;
         *         }) : dep);
         */

    }

    async deploymentsByApp(appId, deployments) {
        if (isEmpty(deployments)) {
            return [];
        }
        const deps = await this.DeploymentAppName.findAsync({app: appId, name: within(deployments)});
        if (isEmpty(deps)) return [];
        const depMap = await promiseMap(reducer(deps, (ret, d) => (ret[d.name] = this.deploymentForKey(d.key))));

        return depMap;
        /*  return this._all(`select key,name FROM deployments_app_name WHERE app = ? AND name IN ?`, [appId, deployments])
         .then(deps => promiseMap(reducer(deps, (ret, d) => (ret[d.name] = this.deploymentForKey(d.key)))));*/
    }

    async deploymentByApp(appId, deployment) {
        const d = await this.DeploymentAppName.findOneAsync({app: appId, name: deployment});
        if (!d) return;
        return this.deploymentForKey(d.key);
        /*   return this._first(`select key,name FROM deployments_app_name WHERE app = ? AND name = ?`, [appId, deployment])
         .then(d => d && this.deploymentForKey(d.key));*/

    }

    appsForCollaborator(email) {
        return this.App.findAsync({collaborators: {$contains_key: email}});
        // return this._all(`SELECT * FROM apps WHERE collaborators CONTAINS KEY ?`, [email]);
    }

    async  appForCollaborator(email, name) {
        const app = await  this.App.findOneAsync({
            collaborators: {$contains_key: email},
            name
        }, {allow_filtering: true});
        if (app && app.deployments == null) {
            app.deployments = [];
        }
        return app;
        //return this._first(`SELECT * FROM apps WHERE collaborators CONTAINS KEY ? AND name = ? ALLOW FILTERING`, [email, name]);
    }

    async appForDeploymentKey(deploymentKey) {
        const {app} = this.DeploymentAppName.findOneAsync({key: deploymentKey});
        return this.appById(app);
        /*    return this._first(`select app FROM deployments_app_name WHERE key = ?`, [deploymentKey])
         .then(({app}) => this.appById(app));*/
    }

    /*  appVersion text,
     status text,
     previousLabelOrAppVersion text,
     previousDeploymentKey text,
     clientUniqueId text,
     deploymentKey text,
     label text,*/
    async insertMetric(obj) {
        const metric = await this.newMetric(obj);
        await metric.saveAsync();
        return metric;
        /*return this._first(`INSERT INTO metrics (id,  appVersion, status,  previousLabelOrAppVersion,  previousDeploymentKey, clientUniqueId, deploymentKey,  label) values (now(), ?,?,?,?,?,?,? )`, [appVersion,
         *   status,
         *   previousLabelOrAppVersion,
         *   previousDeploymentKey,
         *   clientUniqueId,
         *   deploymentKey,
         *   label]);*/
    }

    metrics(deploymentkey) {
        return this.Metric.findAsync({deploymentkey})
        //return this._all(`SELECT * FROM metrics WHERE deploymentkey = ?`, [deploymentKey]);
    }

    clientRatio(clientUniqueId, packageHash) {
        return this.ClientRatio.findOneAsync({clientUniqueId, packageHash});
        //return this._first(`SELECT *  FROM client_ratio WHERE "clientUniqueId" = ? and "packageHash" = ?`, [clientUniqueId, packageHash]);
    }

    insertClientRatio(clientUniqueId, packageHash, ratio, updated) {
        return (this.newClientRatio({clientUniqueId, packageHash, ratio, updated})).saveAsync();
        /*        return this._first(`INSERT INTO client_ratio (
         "inserted",
         "clientUniqueId",
         "packageHash",
         ratio,
         updated) values (toUnixTimestamp(now()), ?,?,?,?)`, [clientUniqueId, packageHash, ratio, updated]);*/
    }

}
module.exports = DaoExpressCassandra;
