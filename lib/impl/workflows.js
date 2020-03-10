const Service = require('../interfaces/Service');
const IonError = require('core/IonError');
const Errors = require('../../errors/backend-errors');

/**
 * @param {dataRepo: DataRepository, auth: Auth, workflow: WorkflowProvider, log: ChangeLogger} options
 */
function workflowService(options) {
  /**
   * @param {*} req
   * @param {User} user
   * @returns {Promise}
   */
  function handlerWrapper(req, user) {
    return options.dataRepo.getItem(req.params.class, req.params.id, {user})
      .then((item) => {
        if (!item)
          throw new IonError(Errors.HTTP_404);
        return item;
      });
  }

  this.route = (router) => {
    this.addHandler(router, '/:class/:id', 'GET', (req) => {
      const user = options.auth.getUser(req);
      return handlerWrapper(req, user)
        .then(item => options.workflow.getStatus(item, {user}));
    });

    this.addHandler(router, '/:class/:id', 'PUT', (req) => {
      const user = options.auth.getUser(req);
      return handlerWrapper(req, user)
        .then((item) => {
          const errors = [];
          let pr = Promise.resolve();
          let transitions;
          if (Array.isArray(req.body)) {
            transitions = {};
            req.body.forEach((el) => {
              const t = el.split('.');
              if (!transitions[t[0]])
                transitions[t[0]] = [];
              transitions[t[0]].push(t[1]);
            });
          } else {
            transitions = req.body;
          }
          Object.keys(transitions).forEach((wf) => {
            let list = transitions[wf];
            if (!Array.isArray(list))
              list = [list];
            list.forEach((tr) => {
              pr = pr
                .then(() => options.workflow.performTransition(item, wf, tr, {
                  user,
                  changeLogger: options.log
                })).catch(error => errors.push(error));
            });
          });
          return pr.then(() => errors);
        });
    });

    this.addHandler(router, '/:class/:id', 'PATCH', (req) => {
      const user = options.auth.getUser(req);
      return handlerWrapper(req, user)
        .then((item) => {
          const errors = [];
          let pr = Promise.resolve();
          req.body.forEach((st) => {
            const t = st.split('.');
            pr = pr
              .then(() => options.workflow.pushToState(item, t[0], t[1], {
                user,
                changeLogger: options.log
              })).catch(error => errors.push(error));
          });
          return pr.then(() => errors);
        });
    });
  };
}

workflowService.prototype = new Service();

module.exports = workflowService;
