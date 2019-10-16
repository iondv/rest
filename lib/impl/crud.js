/**
 * Created by krasilneg on 05.08.19.
 */
const Service = require('../interfaces/Service');
const PropertyTypes = require('core/PropertyTypes');
const normalize = require('core/util/normalize');
const moment = require('moment');
const FO = require('core/FunctionCodes');
const IonError = require('core/IonError');
const Errors = require('core/errors/data-repo');

/**
 * @param {{dataRepo: DataRepository, auth: Auth}} options
 * @constructor
 */
function CrudService(options) {

  function reqToOptions(req, options, fetch) {
    if (req.query._eager) {
      options.forceEnrichment = [];
      req.query._eager.forEach((attr) => {
        options.forceEnrichment.push(attr.split('|'));
      });
    }

    if (fetch) {
      options.offset = Number.parseInt(req.query._offset || 0);
      options.count = Number.parseInt(req.query._count || 5);
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

  function afterEdit(item, updates) {
    if (!item) {
      throw new Error('Object not found!', 404);
    }
    let cw = Promise.resolve();
    for (const nm in updates) {
      if (updates.hasOwnProperty(nm)) {
        const pm = item.getMetaClass().getPropertyMeta(nm);
        if (pm && pm.type === PropertyTypes.COLLECTION) {
          cw = cw
            .then(() =>
              options.dataRepo
                .getList(pm._refClass.getCanonicalName(), {filter: {[pm._refClass.getKeyProperties()[0]]: {$in: updates[nm]}}})
            )
            .then(details => options.dataRepo.put(item, nm, details));
        }
      }
    }
    return cw.then(() => normalize(item, str => str ? moment(str).format() : null));
  }

  function create(req) {
    return options.dataRepo
      .createItem(req.params.class, req.body, null, null,
        reqToOptions(req, {user: options.auth.getUser(req), autoAssign: true}))
      .then(item => afterEdit(item, req.body));
  }

  function fetch(req) {
    return options.dataRepo
      .getList(req.params.class,
        reqToOptions(req, {user: options.auth.getUser(req)}, true))
      .then(items => normalize(items, str => str ? moment(str).format() : null));
  }

  function read(req) {
    return options.dataRepo
      .getItem(req.params.class, req.params.id,
        reqToOptions(req, {user: options.auth.getUser(req)}, true))
      .then((item) => {
        if (!item) {
          throw new Error('Object not found!', 404);
        }
        return normalize(item, str => str ? moment(str).format() : null);
      })
      .catch((err) => {
        if ((err instanceof IonError) && err.code === Errors.PERMISSION_LACK) {
          throw new Error('Access denied', 403);
        }
        throw err;
      });
  }

  function head(req) {
    return read(req);
  }

  function update(req) {
    return options.dataRepo
      .editItem(req.params.class, req.params.id, req.body, null,
        reqToOptions(req, {user: options.auth.getUser(req), autoAssign: true}))
      .then(item => afterEdit(item, req.body))
      .catch((err) => {
        if ((err instanceof IonError) && err.code === Errors.PERMISSION_LACK) {
          throw new Error('Access denied', 403);
        }
        throw err;
      });
  }

  function del(req) {
    return options.dataRepo.deleteItem(req.params.class, req.params.id, null, {user: options.auth.getUser(req)})
      .then(() => null)
      .catch((err) => {
        if ((err instanceof IonError) && err.code === Errors.PERMISSION_LACK) {
          throw new Error('Access denied', 403);
        }
        throw err;
      });
  }

  this.route = (router) => {
    this.addHandler(router, '/:class', 'GET', fetch);
    this.addHandler(router, '/:class/:id', 'HEAD', head);
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
