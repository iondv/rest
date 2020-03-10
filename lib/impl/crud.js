/**
 * Created by krasilneg on 05.08.19.
 */
const Service = require('../interfaces/Service');
const normalize = require('core/util/normalize');
const moment = require('moment');
const FO = require('core/FunctionCodes');
const IonError = require('core/IonError');
const Errors = require('core/errors/data-repo');
const MetaErrors = require('core/errors/meta-repo');
const BackendErrors = require('../../errors/backend-errors');
const multipart = require('../../backend/multipart');
const merge = require('merge');
const {
  prepareUpdates,
  applyCollections
} = require('../../backend/util');

/**
 * @param {{dataRepo: DataRepository, auth: Auth}} options
 * @constructor
 */
function CrudService(options) {

  this._initialization = (scope) => {
    options = merge({
      auth: scope.auth,
      metaRepo: scope.metaRepo,
      dataRepo: scope.dataRepo,
      keyProvider: scope.keyProvider,
      fileStorage: scope.fileStorage
    }, options);
  };

  /**
   *
   * @param item
   * @returns {{}}
   */
  function normalizeItem(item) {
    return normalize(item, str => (str ? moment(str).format() : null));
  }

  /**
   *
   * @param req
   * @param options
   * @param fetch
   * @returns {*|{}}
   */
  function reqToOptions(req, options, fetch) {
    options = options || {};

    if (req.query._eager) {
      options.forceEnrichment = [];
      req.query._eager.forEach((attr) => {
        options.forceEnrichment.push(attr.split('|'));
      });
    }

    if (fetch) {
      options = Object.assign(options, req.body);
      options.offset = Number.parseInt(req.query._offset || options.offset || 0);
      options.count = Number.parseInt(req.query._count || options.count || 5);
      const f = [];
      for (const nm in req.query) {
        if (req.query.hasOwnProperty(nm) && (nm !== '_eager') && (nm !== '_offset') && (nm !== '_count')) {
          f.push({[FO.EQUAL]: [`$${nm}`, req.query[nm]]});
        }
      }
      if (f.length) {
        options.filter = {[FO.AND]: f};
      }
    }
    return options;
  }

  /**
   *
   * @param req
   * @returns {*}
   */
  function reqToData(req) {
    return multipart(req).then(data => data || req.body);
  }

  /**
   *
   * @param err
   * @returns {IonError|*}
   */
  function wrapError(err) {
    if ((err instanceof IonError)) {
      switch (err.code) {
        case Errors.PERMISSION_LACK: return new IonError(BackendErrors.HTTP_403, {}, err);
        case MetaErrors.NO_CLASS:
        case Errors.ITEM_NOT_FOUND: return new IonError(404, {}, err);
        case Errors.ITEM_EXISTS:
          return new IonError(400, {}, err);
        case Errors.FAIL: return wrapError(err.cause);
        default:
          return err;
      }
    }
    return err;
  }

  /**
   *
   * @param req
   * @returns {*}
   */
  function create(req) {
    const updOptions = reqToOptions(req, {
      user: options.auth.getUser(req), autoAssign: true
    });
    updOptions.skipResult = false;
    let updates;
    let collUpdates;
    const cm = options.metaRepo.getMeta(req.params.class);
    return reqToData(req)
      .then(data => prepareUpdates(options, data, cm, req.params.id))
      .then(({/*id, */data, collections}) => {
        updates = data;
        collUpdates = collections;
        /*return id
          ? options.dataRepo.saveItem(req.params.class, id, updates, null, null, updOptions)
         :
         */
        return options.dataRepo.createItem(req.params.class, updates, null, null, updOptions);
      })
      .then(item => applyCollections(options, item, collUpdates))
      .then(item => normalizeItem(item))
      .catch((err) => {
        throw wrapError(err);
      });
  }

  /**
   *
   * @param req
   * @returns {Promise<{}>}
   */
  function fetch(req) {
    return options.dataRepo
      .getList(req.params.class,
        reqToOptions(req, {user: options.auth.getUser(req)}, true))
      .then(items => normalize(items, str => (str ? moment(str).format() : null)))
      .catch((err) => {
        throw wrapError(err);
      });
  }


  /**
   *
   * @param req
   * @returns {Promise<{}>}
   */
  function read(req) {
    return options.dataRepo
      .getItem(req.params.class, req.params.id,
        reqToOptions(req, {user: options.auth.getUser(req)}, true))
      .then((item) => {
        if (!item) {
          throw new IonError(Errors.ITEM_NOT_FOUND, {info: `${req.params.class}@${req.params.id}`});
        }
        return normalize(item, str => (str ? moment(str).format() : null));
      })
      .catch((err) => {
        throw wrapError(err);
      });
  }

  /**
   *
   * @param req
   * @returns {*}
   */
  function update(req) {
    const updOptions = reqToOptions(req, {
      user: options.auth.getUser(req), autoAssign: true
    });
    let updates;
    let collUpdates;
    const cm = options.metaRepo.getMeta(req.params.class);
    return reqToData(req)
      .then(data => prepareUpdates(options, data, cm, req.params.id))
      .then(({data, collections}) => {
        updates = data;
        collUpdates = collections;
        return options.dataRepo.editItem(req.params.class, req.params.id, updates, null, updOptions);
      })
      .then(item => applyCollections(options, item, collUpdates))
      .then(item => normalizeItem(item))
      .catch((err) => {
        throw wrapError(err);
      });
  }

  /**
   *
   * @param req
   * @returns {Promise<unknown>}
   */
  function del(req) {
    return options.dataRepo.deleteItem(req.params.class, req.params.id, null, {user: options.auth.getUser(req)})
      .then(() => null)
      .catch((err) => {
        throw wrapError(err);
      });
  }

  this.route = (router) => {
    this.addHandler(router, '/:class', 'GET', fetch);
    this.addHandler(router, '/:class', 'SEARCH', fetch);
    this.addHandler(router, '/:class/:id', 'HEAD', read);
    this.addHandler(router, '/:class/:id', 'GET', read);
    this.addHandler(router, '/:class', 'POST', create);
    this.addHandler(router, '/:class/:id', 'PATCH', update);
    this.addHandler(router, '/:class/:id', 'PUT', update);
    this.addHandler(router, '/:class/:id', 'DELETE', del);
    return Promise.resolve();
  };
}

CrudService.prototype = new Service();

module.exports = CrudService;
