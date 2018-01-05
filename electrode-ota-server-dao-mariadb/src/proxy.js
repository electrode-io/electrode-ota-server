import _ from "lodash";
import Sequelize from "sequelize";

/**
 * Use `in` for querying an array
 * OTA Query:               { name: ['cat', 'tom'] }
 * Sequelize equivalent:    { name: {[Sequelize.Op.in]: ['cat', 'tom']} }
 * @param {*} val
 */
const toSequelizeIn = val => {
  if (_.isArray(val)) return { [Sequelize.Op.in]: val };
  else return val;
};

/**
 * Convert OTA query containing an association to Sequelize query
 * OTA Query: { 'accessKeys': 'abc' }
 * Sequelize equivalent: {
 *   model: UserAccessKeys,
 *   as: 'accessKeys',
 *   where: {
 *       'key': 'abc'
 *   }
 * }
 * @param {*} key
 * @param {*} association
 * @param {*} queryValue
 */
const toSequelizeIncludeTerm = (key, association, queryValue) => {
  let term = {
    model: association.model,
    as: key
  };
  if (queryValue) {
    term["where"] = {
      [association.searchField]: toSequelizeIn(queryValue)
    };
  }
  if (association.through) {
    term["through"] = association.through;
  }
  if (association.attributes) {
    term["attributes"] = association.attributes;
  }
  return term;
};

/**
 * Convert OTA query to Sequelize query
 *
 * @param {*} modelDefinition
 * @param {*} query
 */
const generateSequelizeQuery = (modelDefinition, query) => {
  let include = [],
    order = [];
  let where = _.mapValues(query, val => toSequelizeIn(val));

  _.each(modelDefinition._associations, (assoc, assocAs) => {
    if (where[assocAs]) {
      include.push(toSequelizeIncludeTerm(assocAs, assoc, where[assocAs]));
      delete where[assocAs];
    } else {
      include.push(toSequelizeIncludeTerm(assocAs, assoc, null));
    }
    if (assoc.order) {
      order.push(assoc.order);
    }
  });
  let seqQuery = {};
  if (!_.isEmpty(where)) seqQuery["where"] = where;
  if (!_.isEmpty(include)) seqQuery["include"] = include;
  if (!_.isEmpty(order)) seqQuery["order"] = order;
  return seqQuery;
};

/**
 * Options to include for updates/inserts
 *
 * @param {*} modelDefinition
 * @param {*} options
 */
const toSequelizeOptions = (modelDefinition, options) => {
  let extensions = {
    include: []
  };
  _.each(modelDefinition._associations, (association, assocationAs) => {
    extensions.include.push(
      toSequelizeIncludeTerm(assocationAs, association, null)
    );
  });
  return Object.assign({}, options, extensions);
};

export function ProxyModelWrapper(client, modelDefinition) {
  /**
   * ProxyModel wraps a Sequelize Model.
   * Provides consistent interface to OTA server
   */
  class ProxyModel {
    constructor(values) {
      Object.assign(this, values);

      var _originalModel = null;
      this._setOriginal = function(m) {
        _originalModel = m;
      };
      this._getOriginal = function() {
        return _originalModel;
      };
    }

    /**
     * Create ProxyModel from MySQL Model
     * @param {*} model
     */
    static constructFromSequelizeModel(model) {
      if (model == null) return null;
      const mapper = new ProxyModel();
      mapper.refreshFromSequelizeModel(model);
      return mapper;
    }

    /**
     * Update this ProxyModel to match the Sequelize Model.
     * @param {*} model
     */
    refreshFromSequelizeModel(model) {
      this._setOriginal(model);
      const modelAsJson = ProxyModel._fromSequelizeFormat(model);
      Object.assign(this, modelAsJson);
      return this;
    }

    /**
     * Save this ProxyModel Async
     * @param {*} options
     */
    saveAsync(options = {}) {
      if (this._getOriginal()) {
        return this.updateAsync(this, options);
      } else {
        const extendedOptions = toSequelizeOptions(modelDefinition, options);
        const asJson = ProxyModel._toSequelizeFormat(this);
        return modelDefinition
          .create(asJson, extendedOptions)
          .then(model => this.refreshFromSequelizeModel(model))
          .catch(Sequelize.UniqueConstraintError, e => {
            return Promise.resolve(false);
          });
      }
    }

    /**
     * Update async
     * @param {object} updates
     * @param {object} options
     *      sequelize options
     */
    updateAsync(updates, options = {}) {
      const jsonUpdates = ProxyModel._toSequelizeFormat(updates);
      const seqOptions = toSequelizeOptions(modelDefinition, options);
      return client.transaction(transaction => {
        return this._assignAssociations(jsonUpdates, { transaction })
          .then(_ =>
            this._getOriginal().update(
              jsonUpdates,
              Object.assign(seqOptions, { transaction })
            )
          )
          .then(model => this.refreshFromSequelizeModel(model));
      });
    }

    /**
     * Delete async
     */
    deleteAsync() {
      return this._getOriginal().destroy();
    }

    /**
     * Add an associated object
     * @param {ProxyModel} model - associated object to add
     */
    associateAsync(model) {
      return this._getOriginal().associate(model._getOriginal());
    }

    static _fromSequelizeFormat(sequelizeRecord) {
      if (!sequelizeRecord) return null;
      let jsonRecord = sequelizeRecord.toJSON();
      return jsonRecord;
    }
    static _toSequelizeFormat(values) {
      let ret = Object.assign({}, values);
      if (modelDefinition._associations) {
        _.each(modelDefinition._associations, (assocation, associationAs) => {
          ret[associationAs] = _.map(ret[associationAs], (vals, key) =>
            Object.assign({}, vals, { [assocation.searchField]: key })
          );
        });
      }
      return ret;
    }

    /**
     * Find one object that matches the provided query
     * @param {*} queryParams   : find query (key-value pairs)
     */
    static findOneAsync(queryParams) {
      let sequelizeQuery = generateSequelizeQuery(modelDefinition, queryParams);
      return modelDefinition
        .findOne(sequelizeQuery)
        .then(ProxyModel.constructFromSequelizeModel);
    }

    /**
     * Find all objects that match the provided query
     * @param {*} queryParams
     */
    static findAsync(queryParams) {
      const sequelizeQuery = generateSequelizeQuery(
        modelDefinition,
        queryParams
      );
      return modelDefinition
        .findAll(sequelizeQuery)
        .then(results =>
          _.map(results, ProxyModel.constructFromSequelizeModel)
        );
    }

    /**
     * Delete objects matching the specified query
     * @param {*} query
     */
    static delete(query) {
      return ProxyModel.findOneAsync(query).then(model => model.deleteAsync());
    }

    _assignAssociations(updates, options = {}) {
      const actions = _.reduce(
        modelDefinition._associations,
        (accu, assoc, assocAs) => {
          if (updates[assocAs]) {
            accu = accu.concat(
              _.map(updates[assocAs], assocItem => {
                if (
                  this._getOriginal() &&
                  this._getOriginal().createOrUpdateAssociate
                ) {
                  return this._getOriginal().createOrUpdateAssociate(assocItem);
                } else {
                  return Promise.resolve();
                }
              })
            );
          }
          return accu;
        },
        []
      );
      return Promise.all(actions);
    }
  }

  return ProxyModel;
}
