/**
 * Created by krasilneg on 09.01.20.
 */

const request = require('request');
const sys = require('core/system');
const {readYaml} = require('core/util/read');
const base64 = require('base64-js');
const IonError = require('core/IonError');

/**
 * @param {{}} options
 * @param {String|Object} options.definition
 * @param {String} options.clientId
 * @param {String} options.clientSecret
 * @param {String} options.tokenPath
 * @param {String} [options.base]
 * @param {String} [options.endPoint]
 * @param {Logger} [options.log]
 * @constructor
 */
function GateWay(options) {

  const serviceHost = options.endPoint;
  const clientId = options.clientId;
  const clientSecret = options.clientSecret;

  let token = false;

  function host(req) {
    return serviceHost || (req.protocol + '://' + req.get('host'));
  }

  function ensureToken(host) {
    if (token) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      request({
        url: host + options.tokenPath,
        method: 'get',
        headers: {
          Authorization: 'Basic ' + base64.fromByteArray(Buffer.from(clientId + ':' + clientSecret, 'utf8'))
        }
      }, function (err, response, body) {
        if (err || response.statusCode !== 200) {
          token = false;
          return reject(err || new IonError(response.statusCode, {}, {message: body}));
        }

        token = body;
        resolve();
      });
    });
  }

  function byPass(path, method, req, res) {
    const destHost = host(req);
    ensureToken(destHost)
      .then(() => new Promise((resolve, reject) => {
        const r = request[method]({
          url: destHost + path,
          query: req.query,
          auth: {
            bearer: token
          }
        });
        if (method == 'post' || method == 'put' || method == 'patch') {
          req.pipe(r);
        }
        r.on('response', (response) => {
          if (response.statusCode === 401 || response.statusCode === 403) {
            token = false;
            byPass(path, method, req, res);
            return;
          }
          r.pipe(res);
          resolve();
        });
        r.on('error', (err) => {
          reject(err);
        });
      }))
      .catch((err) => {
        options.log && options.log.error(`failed to obtain authorization token from ${destHost + options.tokenPath}`);
        options.log && options.log.error(err);
        res.status(500).send('internal server error');
      });
  }

  function readDefinition() {
    if (typeof options.definition == 'object') {
      return Promise.resolve(options.definition);
    }
    return readYaml(sys.toAbsolute(options.definition));
  }

  this._initialization = function (scope) {
    const app = scope.application || scope.module;
    const base = options.base || (scope.module && scope.module.path);

    if (app) {
      if (options.definition) {
        return readDefinition()
          .then((def) => {
            if (def.paths && typeof def.paths == 'object')
              for (let path in def.paths) {
                if (path) {
                  const spec = def.paths[path];
                  for (let method in spec) {
                    if (method) {
                      app[method](base + path, (req, res) => {
                        byPass(path, method, req, res);
                      });
                    }
                  }
                }
              }
          });
      }
    }
    return Promise.resolve();
  };
}

module.exports = GateWay;