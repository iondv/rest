/**
 * Created by kras on 21.09.16.
 */
const moduleName = require('../../module-name');
const di = require('core/di');
const IonError = require('core/IonError');
const Errors = require('../../errors/backend-errors');

function Service() {
  this.addHandler = function (router, path, method, handler) {
    router[method.toLowerCase()](path, (req, res) => {
      Promise.resolve(handler(req))
        .then((response) => {
          if (response && typeof response === 'object') {
            if (response.hasOwnProperty('headers') && typeof response.headers === 'object') {
              res.set(response.headers);
            }
            if (typeof response.data === 'string' || typeof response.data === 'object') {
              response = response.data;
            }
          }
          res.status(200).send(response);
        })
        .catch((err) => {
          if ((err instanceof IonError)) {
            if (err.code === Errors.HTTP_403) {
              return res.status(403).send(err.message);
            }
            if (err.code === Errors.HTTP_404) {
              return res.status(404).send(err.message);
            }
          }
          const scope = di.context(moduleName);
          scope.sysLog.error(typeof err === 'object' && err.message ? err.message : err);
          if (typeof err.code == 'number' && err.code >= 400 && err.code < 500) {
            return res.status(err.code).send(err.message);
          }
          res.status(500).send('Internal server error');
        });
    });
  };

  this.route = function (router) {
    this._route(router);
  };
}

module.exports = Service;

