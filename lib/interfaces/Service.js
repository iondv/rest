/**
 * Created by kras on 21.09.16.
 */
const moduleName = require('../../module-name');
const di = require('core/di');

function Service() {
  this.addHandler = function (router, path, method, handler) {
    router[method.toLowerCase()](path, (req, res) => {
      handler(req)
        .then((response) => {
          if (response && typeof response === 'object') {
            if (response.hasOwnProperty('headers') && typeof response.headers === 'object') {
              res.set(response.headers);
            }
            if (typeof response.data === 'string' || typeof response.data === 'object') {
              response = response.data;
            }
            return res.status(200).send(response);
          }
          res.sendStatus(200);
        })
        .catch((err) => {
          if (err.code === 403) {
            return res.status(403).send(err.message);
          }
          if (err.code === 404) {
            return res.status(404).send(err.message);
          }
          const scope = di.context(moduleName);
          scope.sysLog.error(err);
          res.status(500).send('Internal server error');
        });
    });
  };

  this.route = function (router) {
    this._route(router);
  };
}

module.exports = Service;

