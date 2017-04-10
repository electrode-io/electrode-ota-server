
import BaseCassandra from './base-cassandra';
import {promiseMap, reducer, remove} from 'electrode-ota-server-util';
import {alreadyExistsMsg} from 'electrode-ota-server-errors';
const historySort = history=> history && history.sort((a, b)=>b.created_.getTime() - a.created_.getTime());

const removeCreated = v => {
    v && v.forEach(b=>delete b.created_);
    return v;
};
const asKey = v=>v && v.key;

const asKeyAll = (v, arr)=> v.key && arr.push(v.key);

const historyAll = (v, arr)=> v.history_ && arr.push(...v.history_);

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

const {
    uuid,
    tuuid,
    q,
    updater,
    insertError,
} = BaseCassandra;

export default class DaoLegacyCassandra extends BaseCassandra {


    createUser({email, name, accessKeys = {}, linkedProviders = ['GitHub']}) {
        const id = uuid() + '';
        return this._first(`INSERT INTO users (email, name, "accessKeys", "linkedProviders", id, "createdTime") VALUES ( ?, ?,?, ?, ?, toUnixTimestamp(now())) IF NOT EXISTS`,
            [email, name, accessKeys, linkedProviders, id], insertError)
            .then(dne=> alreadyExistsMsg(dne, `User already exists ${email}`))
            .then(ret => this.userById(id));

    }

    createApp({name, deployments = {}, collaborators}) {
        const id = uuid();
        return this._first(`INSERT INTO apps (name, collaborators, id, deployments) values (?,?,?,?)`, [name, collaborators, id, Object.keys(deployments)])
            .then(_=>Promise.all(Object.keys(deployments).map(d=>this.addDeployment(id, d, deployments[d]))))
            .then(_=>this.appById(id));
    }

    updateApp(id, {name, collaborators}) {

        return this._first(`UPDATE apps SET name=?,  collaborators=? WHERE id = ?`, [name, collaborators, id])
            .then(_ =>this.appById(id));
    }

    _deploymentsByAppId(appId) {
        return this._first(`SELECT deployments FROM apps WHERE id = ?`, [appId], r=>r.deployments);
    }

    _deploymentKeyByAppAndName(appId, deploymentName) {
        return this._first(`SELECT key FROM deployments_app_name WHERE  app = ? AND name = ?  `, [appId, deploymentName], asKey);
    }

    _deploymentByAppAndName(appId, deploymentName) {
        return this._deploymentKeyByAppAndName(appId, deploymentName)
            .then(key=>this._first(`SELECT * FROM deployments WHERE key = ?`, [key]));
    }

    addDeployment(appId, name, {key}) {
        return this._deploymentsByAppId(appId)
            .then(deployments => this._batch([
                q(`INSERT INTO deployments ("createdTime", id, name, key) VALUES ( toUnixTimestamp(now()),  now(), ?, ?)`, name, key),
                q(`INSERT INTO deployments_app_name (key, app, name) VALUES (?, ? , ?)`, key, appId, name),
                q(`UPDATE apps SET deployments = ? WHERE id = ?`, deployments ? deployments.concat(name) : [name], appId)
            ]));

    }


    removeDeployment(appId, deploymentName) {
        return this._deploymentsByAppId(appId)
            .then((dep)=>this._deploymentKeyByAppAndName(appId, deploymentName)
                .then(key=>this._first(`SELECT key, history_ FROM deployments WHERE key = ?`, [key]))
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
                }));
    }

    renameDeployment(appId, oname, nname) {
        if (oname === nname) return Promise.reject(`Can not rename to the same name.`);
        return this._deploymentsByAppId(appId)
            .then(deps => this._deploymentKeyByAppAndName(appId, oname)
                .then(key => this._batch([q(`DELETE FROM deployments_app_name WHERE app = ? AND name = ?`, appId, oname),
                    q(`INSERT INTO deployments_app_name (key, app, name) VALUES (?,?,?)`, key, appId, nname),
                    q(`UPDATE apps SET deployments = ? WHERE id = ?`, remove(deps, oname).concat(nname), appId),
                    q(`UPDATE deployments SET name = ? WHERE key = ?`, nname, key)
                ])));

    }

    addPackage(deploymentKey, pkg) {
        const {params, update} = updater(PACKAGE_FIELDS, pkg);
        return this._first(`SELECT history_ FROM deployments WHERE key = ?`, [deploymentKey], v=>v ? v.history_ : [])
            .then(history=> {
                const pkgId = tuuid();

                //add pkgId first.
                if (history) {
                    history.unshift(pkgId);
                } else {
                    history = [pkgId]
                }
                return this._batch([
                    q(`UPDATE deployments SET history_ = ?  WHERE key = ?`, history, deploymentKey),
                    q(`UPDATE packages SET created_ = toUnixTimestamp(now()), ${update} WHERE "id_" = ?`, ...params, pkgId)
                ]).then(_=>this._first(`SELECT * FROM packages WHERE id_ = ?`, [pkgId]));
            });
    }

    updatePackage(deploymentKey, pkg, label) {
        const {params, update} = updater(PACKAGE_UPDATE_FIELDS, pkg);
        return this._first(`SELECT history_ FROM deployments WHERE key = ? `, [deploymentKey], v=>v.history_ || []).then((ids)=> {

            if (label) {
                const qp = [...params, ids, label];
                return this._first(`UPDATE packages SET ${update} WHERE "id_" in ? AND label = ?`, qp)
                    .then(_=>this._first(`SELECT * FROM packages WHERE id_ in ? AND label = ?`, qp));
            } else {
                const qp = [...params, ids[0]];
                return this._first(`UPDATE packages SET  ${update} WHERE "id_" = ?`, qp)
                    .then(_=>this._first(`SELECT * FROM packages WHERE id_ = ?`, [ids[0]]));
            }
        });
    }


    updateUser(currentEmail, {name, email, accessKeys, linkedProviders}) {
        return this._first(`UPDATE users SET name=?, "accessKeys"=?, "linkedProviders"=? WHERE email= ?`, [name, accessKeys, linkedProviders, currentEmail])
            .then(_=>this.userByEmail(email));
    }

    history(appId, deploymentName) {
        return this._deploymentByAppAndName(appId, deploymentName)
            .then(deployment=>deployment.history_ ? this._all(`SELECT * FROM packages WHERE id_ IN ?`, [deployment.history_]).then(historySort).then(removeCreated) : []);
    }
    historyByIds(historyIds){
        if (historyIds == null || historyIds.length == 0){
            return Promise.resolve([]);
        }
        return this._all(`SELECT * FROM packages WHERE id_ IN ?`, [historyIds]);
    }
    /**
     * Keep the actual history so that the label can update correctly.
     * @param appId
     * @param deploymentName
     * @returns {*|Promise|Promise.<Array>}
     */
    clearHistory(appId, deploymentName) {
        return this._deploymentByAppAndName(appId, deploymentName)
            .then(deployment=>deployment.history_ ? this._first(`DELETE FROM packages WHERE id_ in ?`, [deployment.history_]) : []);

    }

    historyLabel(appId, deploymentName, label) {
        /**
         * Because we can' use in query....
         */
        return this._deploymentByAppAndName(appId, deploymentName)
            .then(deployment=>deployment.history_ && this._all(`SELECT * FROM packages WHERE id_ IN ?`, [deployment.history_]).then(pkgs=>pkgs && pkgs.find(v=>v.label == label)));
    }

    packageById(pkg) {
        if (!pkg) return pkg;
        return this._first(`SELECT * FROM packages WHERE id_ = ?`, [pkg]);
    }

    removeApp(appId) {

        return this._all(`SELECT key FROM deployments_app_name  WHERE app = ?`, [appId], asKeyAll)
            .then(keys=> {
                return this._all(`SELECT history_ FROM deployments WHERE key IN  ?`, [keys], historyAll)
                    .then(packages=> {
                        const batch = [
                            q(`DELETE FROM deployments_app_name WHERE app = ?`, appId),
                            q(`DELETE FROM apps WHERE id = ?`, appId)
                        ];

                        if (packages && packages.length) {
                            batch.push(q(`DELETE FROM packages WHERE id_ IN ?`, packages));
                        }

                        if (keys && keys.length) {
                            batch.unshift(q(`DELETE FROM deployments WHERE key IN ?`, keys));
                        }
                        return this._batch(batch);
                    })
            });
    }

    userByAccessKey(accessKey) {
        return this._first(`SELECT * FROM users WHERE "accessKeys" CONTAINS KEY ?`, [accessKey]);
    }


    userById(id) {
        return this._first(`SELECT * FROM users WHERE id = ?`, [id]);
    }

    userByEmail(email) {
        return this._first(`SELECT * FROM users WHERE email = ?`, [email]);
    }

    appById(id) {
        return this._first(`SELECT * FROM apps WHERE id = ?`, [id]);
    }

    upload(packageHash, content) {
        if (!Buffer.isBuffer(content)) {
            content = Buffer.from(content, 'utf8')
        }
        return this._first(`INSERT INTO packages_content ("packageHash", content) VALUES(?,?) IF NOT EXISTS`, [packageHash, content]).then(insertError)
    }

    download(packageHash) {
        return this._first(`SELECT content FROM packages_content WHERE "packageHash" = ? `, [packageHash]).then(v=>v.content);
    }

    deploymentForKey(deploymentKey) {
        return this._first(`SELECT * FROM deployments WHERE key = ?`, [deploymentKey])
            .then(dep => dep && dep.history_ ? this._first(`SELECT * FROM packages WHERE id_ = ?`, [dep.history_[0]])
                .then(pkg => {
                    dep.package = pkg;
                    return dep;
                }) : dep);

    }

    deploymentsByApp(appId, deployments) {
        return this._all(`select key,name FROM deployments_app_name WHERE app = ? AND name IN ?`, [appId, deployments])
            .then(deps=>promiseMap(reducer(deps, (ret, d)=> (ret[d.name] = this.deploymentForKey(d.key)))));
    }

    deploymentByApp(appId, deployment) {
        return this._first(`select key,name FROM deployments_app_name WHERE app = ? AND name = ?`, [appId, deployment])
            .then(d=>d && this.deploymentForKey(d.key));

    }

    appsForCollaborator(email) {
        return this._all(`SELECT * FROM apps WHERE collaborators CONTAINS KEY ?`, [email]);
    }

    appForCollaborator(email, name) {
        return this._first(`SELECT * FROM apps WHERE collaborators CONTAINS KEY ? AND name = ? ALLOW FILTERING`, [email, name]);
    }

    appForDeploymentKey(deploymentKey) {
        return this._first(`select app FROM deployments_app_name WHERE key = ?`, [deploymentKey])
            .then(({app})=>this.appById(app));
    }

    /*  appVersion text,
     status text,
     previousLabelOrAppVersion text,
     previousDeploymentKey text,
     clientUniqueId text,
     deploymentKey text,
     label text,*/
    insertMetric({
        appVersion,
        status,
        previousLabelOrAppVersion,
        previousDeploymentKey,
        clientUniqueId,
        deploymentKey,
        label
    }) {
        return this._first(`INSERT INTO metrics (id,  appVersion, status,  previousLabelOrAppVersion,  previousDeploymentKey, clientUniqueId, deploymentKey,  label) values (now(), ?,?,?,?,?,?,? )`, [appVersion,
            status,
            previousLabelOrAppVersion,
            previousDeploymentKey,
            clientUniqueId,
            deploymentKey,
            label]);
    }

    metrics(deploymentKey) {
        return this._all(`SELECT * FROM metrics WHERE deploymentkey = ?`, [deploymentKey]);
    }

    clientRatio(clientUniqueId, packageHash) {
        return this._first(`SELECT *  FROM client_ratio WHERE "clientUniqueId" = ? and "packageHash" = ?`, [clientUniqueId, packageHash]);
    }

    insertClientRatio(clientUniqueId, packageHash, ratio, updated) {
        return this._first(`INSERT INTO client_ratio (
       "inserted",
       "clientUniqueId",
       "packageHash",
       ratio,
       updated) values (toUnixTimestamp(now()), ?,?,?,?)`, [clientUniqueId, packageHash, ratio, updated]);
    }

}
