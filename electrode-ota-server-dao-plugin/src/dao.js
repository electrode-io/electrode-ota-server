import { promiseMap, reducer, remove, toJSON } from "electrode-ota-server-util";
import { alreadyExistsMsg } from "electrode-ota-server-errors";
import UDTS from "./models/UDTS.json";
import { find } from "lodash";
import semver from "semver";

const historySort = history =>
  history &&
  history.sort((a, b) => b.created_.getTime() - a.created_.getTime());

const toLowerCaseKeys = obj => {
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
  for (const _v of v) _v.key && arr.push(_v.key);
  return arr;
};

const historyAll = (v, arr = []) => {
  v = Array.isArray(v) ? v : [v];
  for (const _v of v) _v.history_ && arr.push(..._v.history_);
  return arr;
};

const BATCH = { return_query: true };

const nullUnlessValue = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] === void 0) {
      obj[key] = null;
    }
  }
  return obj;
};

const notimplement = () => {
  throw new Error(`Method is not implemented`);
};
const isEmpty = arr => {
  if (arr == null) return true;
  if (arr.length === 0) return true;
  return false;
};
const isNotEmpty = arr => !isEmpty(arr);

const apply = (target, source) => {
  if (!source) {
    return target;
  }
  for (const key of Object.keys(target)) {
    if (key == "_validators") continue;
    if (source.hasOwnProperty(key)) {
      const newValue = source[key];
      target[key] = newValue;
    }
  }
  return target;
};

const within = $in => {
  if (isEmpty($in)) {
    throw new Error(`Can not look within an empty array!`);
  }
  if ($in.length === 1) {
    return $in[0];
  }
  return { $in };
};

const Mock = {
  updateAsync: notimplement,
  update: notimplement,
  delete: notimplement,
  deleteAsync: notimplement,
  findOneAsync: notimplement,
  findAsync: notimplement
};

const ifExists = result => result.first().get("[applied]") != false;

const matchTags = (desiredTags, currentTags) => {
  if (!desiredTags || !desiredTags.length === 0) {
    // no desired tags, tags match if existing has no tags as well
    return !currentTags || currentTags.length === 0;
  } else {
    if (currentTags) {
      // matches if a desired tag is in the current tags
      for (let j = 0; j < desiredTags.length; j++) {
        if (currentTags.indexOf(desiredTags[j]) >= 0) return true;
      }
    } else {
      // no current tags, matches everyone
      return true;
    }
  }
  return false;
};

export default class DaoExpressCassandra {
  //these are just here for autocomplete.
  App = Mock;
  ClientRatio = Mock;
  DeploymentAppName = Mock;
  Deployment = Mock;
  Metric = Mock;
  PackageContent = Mock;
  Package = Mock;
  User = Mock;

  constructor({ client, logger }) {
    Object.assign(this, client.instance);
    this._models = client;
    this.logger = logger;
  }

  async disconnect() {
    if (this._models) {
      await this._models.closeAsync();
    }
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
    pkg.id_ = this._models.timeuuid();
    pkg.created_ = Date.now();
    pkg.lastUpdated = Date.now();
    if (pkg.size)
      pkg.size = this._models.driver.types.Integer.fromNumber(pkg.size);

    return new this.Package(pkg);
  }

  newUser(user) {
    user.id = this._models.uuid();
    return new this.User(user);
  }

  async createUser({ email, name, accessKeys, linkedProviders = ["GitHub"] }) {
    const user = this.newUser({ email, name, accessKeys, linkedProviders });
    const result = await user.saveAsync({ if_not_exist: true });
    alreadyExistsMsg(ifExists(result), `User already exists ${email}`);

    return user;
  }

  async createApp({ name, deployments = {}, collaborators }) {
    const deps = Object.keys(deployments);

    const app = this.newApp({ name, collaborators });
    await app.saveAsync();
    if (isNotEmpty(deps)) {
      for (const name of deps) {
        await this.addDeployment(app.id, name, deployments[name]);
      }
    }
    app.deployments = deps;
    return app;
  }

  async updateApp(id, { name, collaborators }) {
    const app = await this.App.findOneAsync({ id });
    app.name = name;
    app.collaborators = collaborators;
    await app.saveAsync();
    return app;
  }

  async _deploymentsByAppId(appId) {
    const app = await this.App.findOneAsync({ id: appId });
    return app.deployments;
  }

  async _deploymentKeyByAppAndName(app, name) {
    const dan = await this.DeploymentAppName.findOneAsync({ app: app, name });
    if (!dan) {
      console.log(`Could not find ${app} ${name}`);
      throw new Error(`No app found for id ${app} and ${name}`);
    }
    return dan.key;
  }

  async _deploymentByAppAndName(appId, deploymentName) {
    const key = await this._deploymentKeyByAppAndName(appId, deploymentName);
    return this.Deployment.findOneAsync({ key });
  }

  async addDeployment(app, name, { key }) {
    let deployments = await this._deploymentsByAppId(app);
    if (deployments == null) {
      deployments = [name];
    } else {
      deployments = deployments.concat(name);
    }
    return this._batch(
      this.newDeployment({ name, key }).save(BATCH),
      this.newDeploymentAppName({ key, app, name }).save(BATCH),
      this.App.update({ id: app }, { deployments }, BATCH)
    );
  }

  async removeDeployment(appId, deploymentName) {
    const dep = await this._deploymentsByAppId(appId);
    const key = await this._deploymentKeyByAppAndName(appId, deploymentName);
    const history_ = await this._historyForDeployment(key);
    const deployments = remove(dep, deploymentName);
    return this._batch(
      this.DeploymentAppName.delete(
        { app: appId, name: deploymentName },
        BATCH
      ),
      this.App.update({ id: appId }, { deployments }, BATCH),
      this.Deployment.delete({ key }, BATCH),
      isNotEmpty(history_) &&
        this.Package.delete({ id_: within(history_) }, BATCH)
    );
  }

  _batch(...queries) {
    const execute = queries.filter(Boolean);
    return this._models.doBatchAsync(execute);
  }

  async renameDeployment(appId, oname, nname) {
    if (oname == nname) throw new Error(`Can not rename to the same name.`);

    const deps = await this._deploymentsByAppId(appId);
    const key = await this._deploymentKeyByAppAndName(appId, oname);

    return this._batch(
      this.DeploymentAppName.delete({ app: appId, name: oname }, BATCH),
      this.newDeploymentAppName({ key, app: appId, name: nname }).save(BATCH),
      this.App.update(
        { id: appId },
        { deployments: remove(deps, oname).concat(nname) },
        BATCH
      ),
      this.Deployment.update({ key }, { name: nname }, BATCH)
    );
  }

  async _historyForDeployment(key) {
    const res = await this.Deployment.findOneAsync({ key });
    return res.history_;
  }

  async addPackage(deploymentKey, value) {
    let history_ = await this._historyForDeployment(deploymentKey);
    const pkg = this.newPackage(value);
    const res = await pkg.saveAsync({ if_not_exist: true });

    if (isEmpty(history_)) {
      history_ = [pkg.id_];
    } else {
      history_ = [pkg.id_, ...history_];
    }
    await this.Deployment.updateAsync({ key: deploymentKey }, { history_ });
    pkg.history_ = history_;
    return pkg;
  }

  async updatePackage(deploymentKey, pkg, label) {
    const history_ = await this._historyForDeployment(deploymentKey);
    if (isEmpty(history_)) {
      throw new Error(
        `Can not update a package without history, probably means things have gone awry.`
      );
    }
    let rpkg;

    if (label) {
      rpkg = await this.Package.findAsync({ id_: within(history_) }).then(
        results => {
          const filtered_results = find(results, o => o.label === label);
          if (!filtered_results) {
            throw new Error(`Label ${label} not found`);
          }
          return filtered_results;
        }
      );
    } else {
      rpkg = await this.Package.findOneAsync({ id_: history_[0] });
    }
    apply(rpkg, pkg);
    rpkg.lastUpdated = Date.now();
    await rpkg.saveAsync();
    return rpkg;
  }

  async addPackageDiffMap(deploymentKey, pkg, pkgHash) {
    return this.updatePackage(deploymentKey, pkg, "");
  }

  /**
   * For a given deployment, it gets the latest available release package
   * that matches the passed in tags.
   *
   * @param {*} deploymentKey string - the deployment key of the app on the device
   * @param {*} tags string[] - the list of tags the device has sent
   * @param {*} appVersion string - appVersion of package to match
   */
  async getNewestApplicablePackage(deploymentKey, tags, appVersion) {
    const packageHashes = await this._historyForDeployment(deploymentKey);
    if (packageHashes && packageHashes.length > 0) {
      let packages = await this.Package.findAsync({
        id_: within(packageHashes)
      });
      packages = historySort(packages);

      for (let i = 0; i < packages.length; i++) {
        let pkg = packages[i];
        let tagsDoMatch = matchTags(tags, pkg.tags);
        let versionsDoMatch = semver.satisfies(appVersion, pkg.appVersion);
        if (tagsDoMatch && versionsDoMatch) {
          return pkg;
        }
      }
      if ((!tags || tags.length === 0) && !appVersion) {
        // if no tag or version, return latest
        return packages[0];
      }
    }
  }

  async updateUser(currentEmail, update) {
    const user = await this.userByEmail(currentEmail);
    apply(user, update);
    await user.saveAsync();
    const js = toJSON(user);

    for (const key of Object.keys(js.accessKeys)) {
      nullUnlessValue(js.accessKeys[key], ACCESSKEY);
    }
    return js;
  }

  async history(appId, deploymentName) {
    const deployment = await this._deploymentByAppAndName(
      appId,
      deploymentName
    );
    if (!deployment.history_) {
      return [];
    }
    const pkgs = await this.Package.findAsync({
      id_: within(deployment.history_)
    });

    const sort = historySort(pkgs);
    return sort;
  }

  historyByIds(historyIds) {
    if (historyIds == null || historyIds.length == 0) {
      return [];
    }
    return this.Package.findAsync({ id_: within(historyIds) });
  }

  /**
   * Keep the actual history so that the label can update correctly.
   * @param appId
   * @param deploymentName
   * @returns {*|Promise|Promise.<Array>}
   */
  async clearHistory(appId, deploymentName) {
    const deployment = await this._deploymentByAppAndName(
      appId,
      deploymentName
    );
    if (deployment && isNotEmpty(deployment.history_)) {
      return this.Package.delete({ id_: within(deployment.history_) });
    }
  }

  async historyLabel(appId, deploymentName, label) {
    /**
     * Because we can' use in query....
     */
    const deployment = await this._deploymentByAppAndName(
      appId,
      deploymentName
    );
    if (isEmpty(deployment.history_)) {
      return;
    }
    const pkgs = await this.Package.findAsync({
      id_: within(deployment.history_)
    });
    if (isNotEmpty(pkgs)) {
      for (const pkg of pkgs) {
        if (pkg.label === label) {
          return pkg;
        }
      }
    }
  }

  async packageById(pkg) {
    if (!pkg) return;
    return this.Package.findOneAsync({ id_: pkg });
  }

  async removeApp(appId) {
    const depAppName = await this.DeploymentAppName.findAsync({ app: appId });
    if (isEmpty(depAppName)) return;
    const keys = asKeyAll(depAppName);
    const deps = await this.Deployment.findAsync({ key: within(keys) });
    if (isEmpty(deps)) return;

    const packages = historyAll(deps);

    return this._batch(
      this.DeploymentAppName.delete({ app: appId }, BATCH),
      this.App.delete({ id: appId }, BATCH),
      isNotEmpty(packages) &&
        this.Package.delete({ id_: within(packages) }, BATCH),
      isNotEmpty(keys) && this.Deployment.delete({ key: within(keys) }, BATCH)
    );
  }

  userByAccessKey(accessKey) {
    return this.User.findOneAsync({ accessKeys: { $contains_key: accessKey } });
  }

  userById(id) {
    return this.User.findOneAsync({ id });
  }

  async userByEmail(email) {
    return this.User.findOneAsync({ email });
  }

  appById(id) {
    return this.App.findOneAsync({ id });
  }

  async upload(packageHash, content) {
    if (!Buffer.isBuffer(content)) {
      content = Buffer.from(content, "utf8");
    }
    const pkg = this.newPackageContent({ packageHash, content });
    const result = await pkg.saveAsync({ if_not_exist: true });
    return ifExists(result);
  }

  async download(packageHash) {
    const pkg = await this.PackageContent.findOneAsync({ packageHash });
    if (pkg != null) return pkg.content;
  }

  async deploymentForKey(deploymentKey) {
    let dep = await this.Deployment.findOneAsync({ key: deploymentKey });

    if (dep && isNotEmpty(dep.history_)) {
      dep = toJSON(dep);
      dep.package = await this.Package.findOneAsync({ id_: dep.history_[0] });
      return dep;
    }
    return dep;
  }

  async deploymentsByApp(appId, deployments) {
    if (isEmpty(deployments)) {
      return [];
    }
    const deps = await this.DeploymentAppName.findAsync({
      app: appId,
      name: within(deployments)
    });
    if (isEmpty(deps)) return [];
    return promiseMap(
      reducer(deps, (ret, d) => (ret[d.name] = this.deploymentForKey(d.key)))
    );
  }

  async deploymentByApp(appId, deployment) {
    const d = await this.DeploymentAppName.findOneAsync({
      app: appId,
      name: deployment
    });
    if (!d) return;
    return this.deploymentForKey(d.key);
  }

  appsForCollaborator(email) {
    return this.App.findAsync({ collaborators: { $contains_key: email } });
  }

  async appForCollaborator(email, name) {
    const app = await this.App.findOneAsync(
      {
        collaborators: { $contains_key: email },
        name
      },
      { allow_filtering: true }
    );
    if (app && app.deployments == null) {
      app.deployments = [];
    }
    return app;
  }

  async appForDeploymentKey(deploymentKey) {
    const { app } = this.DeploymentAppName.findOneAsync({ key: deploymentKey });
    return this.appById(app);
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
  }

  metrics(deploymentkey) {
    return this.Metric.findAsync({ deploymentkey });
  }

  metricsByStatus(deploymentkey) {
    return this.Metric.findAsync({ deploymentkey }).then((metrics = []) => {
      let grouped = metrics.reduce((accumulator, val) => {
        // group by status, label, appversion, previouslydeploymentkey, previouslabeyorappversion
        const key = `${val.status}:${val.label}:${val.appversion}:${
          val.previousdeploymentkey
        }:${val.previouslabelorappversion}`;
        const match =
          accumulator[key] ||
          (accumulator[key] = {
            status: val.status,
            label: val.label,
            appversion: val.appversion,
            previousdeploymentkey: val.previousdeploymentkey,
            previouslabelorappversion: val.previouslabelorappversion,
            total: 0
          });
        match.total++;
        return accumulator;
      }, {});
      return Object.values(grouped);
    });
  }

  clientRatio(clientUniqueId, packageHash) {
    return this.ClientRatio.findOneAsync({ clientUniqueId, packageHash });
  }

  insertClientRatio(clientUniqueId, packageHash, ratio, updated) {
    return this.newClientRatio({
      clientUniqueId,
      packageHash,
      ratio,
      updated
    }).saveAsync();
  }
}
