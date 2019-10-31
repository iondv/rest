const Service = require('../interfaces/Service');
const clone = require('clone');

/**
 * @param {{metaRepo: MetaRepository}} options
 * @constructor
 */
function metaService(options) {

  /**
   * @param {*} datas
   */
  function normalize(datas, filter, except = []) {
    if (datas && typeof datas.plain !== 'undefined')
      return normalize(datas.plain, filter, except);
    if (Array.isArray(datas)) {
      const result = [];
      datas.forEach((dt) => {
        if (typeof filter !== 'function' || filter(dt))
          result.push(normalize(dt, filter, except));
      });
      return result;
    }
    if (except) {
      const result = clone(datas);
      removeSystemProps(result, except);
      return result;
    }
    return datas;
  }

  /**
   * @param {*} datas
   */
  function removeSystemProps(datas, except) {
    if (Array.isArray(datas)) {
      datas.forEach(dt => removeSystemProps(dt, except));
    } else if (typeof datas === 'object' && datas) {
      Object.keys(datas).forEach((k) => {
        if (except.includes(k) || k[0] === '_')
          delete datas[k];
        else
          removeSystemProps(datas[k], except);
      });
    }
  }

  // eslint-disable-next-line max-statements
  this.route = (router) => {
    this.addHandler(router, '/getMeta/:name', 'GET',
      req => normalize(options.metaRepo.getMeta(req.params.name, req.query.version, req.query.namespace)));
    this.addHandler(router, '/listMeta', 'GET',
      req => normalize(options.metaRepo.listMeta(req.query.ancestor, req.query.version, req.query.direct, req.query.namespace)));
    this.addHandler(router, '/ancestor/:classname', 'GET',
      req => normalize(options.metaRepo.ancestor(req.params.classname, req.query.version, req.query.namespace)));
    this.addHandler(router, '/propertyMetas/:classname', 'GET',
      req => normalize(options.metaRepo.propertyMetas(req.params.classname, req.query.version, req.query.namespace),
        pr => pr.name !== '__class' && pr.name !== '__classTitle'));
    this.addHandler(router, '/getNavigationSections', 'GET',
      req => normalize(options.metaRepo.getNavigationSections(req.query.namespace)));
    this.addHandler(router, '/getNavigationSection/:code', 'GET',
      req => normalize(options.metaRepo.getNavigationSection(req.params.code, req.query.namespace)));
    this.addHandler(router, '/getNode/:code', 'GET',
      req => normalize(options.metaRepo.getNode(req.params.code, req.query.namespace)));
    this.addHandler(router, '/getNodes/:section', 'GET',
      req => normalize(options.metaRepo.getNodes(req.params.section, req.query.parent, req.query.namespace)));
    this.addHandler(router, '/getListViewModel/:classname', 'GET',
      req => normalize(options.metaRepo.getListViewModel(req.params.classname, req.query.node,
        req.query.namespace, req.query.version)));
    this.addHandler(router, '/getCollectionViewModel/:classname', 'GET',
      req => normalize(options.metaRepo.getCollectionViewModel(req.params.classname, req.query.collection,
        req.query.node, req.query.namespace, req.query.version)));
    this.addHandler(router, '/getItemViewModel/:classname', 'GET',
      req => normalize(options.metaRepo.getItemViewModel(req.params.classname,
        req.query.node, req.query.namespace, req.query.version)));
    this.addHandler(router, '/getCreationViewModel/:classname', 'GET',
      req => normalize(options.metaRepo.getCreationViewModel(req.params.classname,
        req.query.node, req.query.namespace, req.query.version)));
    this.addHandler(router, '/getDetailViewModel/:classname', 'GET',
      req => normalize(options.metaRepo.getDetailViewModel(req.params.classname,
        req.query.node, req.query.namespace, req.query.version)));
    this.addHandler(router, '/getWorkflows/:classname', 'GET',
      req => normalize(options.metaRepo.getWorkflows(req.params.classname, req.query.namespace, req.query.version),
        null,
        ['statesByName', 'transitionsByName', 'transitionsBySrc', 'transitionsByDest']));
    this.addHandler(router, '/getWorkflowView/:classname/:workflow/:state', 'GET',
      req => normalize(options.metaRepo.getWorkflowView(req.params.classname, req.params.workflow,
        req.params.state, req.query.namespace, req.query.version)));
    this.addHandler(router, '/getWorkflow/:classname/:workflow', 'GET',
      req => normalize(options.metaRepo.getWorkflow(req.params.classname,
        req.params.workflow, req.query.namespace, req.query.version),
      null,
      ['statesByName', 'transitionsByName', 'transitionsBySrc', 'transitionsByDest']));
    this.addHandler(router, '/getMask/:name', 'GET',
      req => normalize(options.metaRepo.getMask(req.params.name)));
    this.addHandler(router, '/getValidators', 'GET',
      req => normalize(options.metaRepo.getValidators()));
    return Promise.resolve();
  };
}

metaService.prototype = new Service();

module.exports = metaService;
