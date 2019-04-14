/**
 * Created by kras on 21.09.16.
 */
'use strict';

const moduleName = require('./module-name');
const di = require('core/di');
const IonError = require('core/IonError');
const errors = require('core/errors/front-end');
const base64 = require('base64-js');

function getReqAuth(req) {
  let result = {
    type: req.get('auth-user-type'),
    token: req.get('auth-token')
  };

  result.user = req.get('auth-user');
  result.pwd = req.get('auth-pwd');
  if (!result.user) {
    let auth = req.get('Authorization');
    if (auth) {
      auth = Buffer.from(base64.toByteArray(auth.replace(/^Basic\s+/, ''))).toString('utf-8').split(':');
      result.user = auth[0];
      result.pwd = auth.length > 1 ? auth[1] : null;
    }
  }
  if (!result.pwd && !result.token) {
    return null;
  }
  return result;
}

module.exports = function (req, res) {
  /**
   * @type {{metaRepo: MetaRepository, sysLog: Logger, settings: SettingsRepository}}
   */
  let scope = di.context(moduleName);

  if (scope.hasOwnProperty(req.params.service)) {
    let authModes = scope.settings.get(moduleName + '.authMode') || {};
    let authMode = 'pwd';
    if (authModes.hasOwnProperty(req.params.service)) {
      authMode = authModes[req.params.service];
    }

    let authCheck = null;
    if (authMode !== 'none') {
      if (authMode === 'oauth') {
        authCheck = scope.oauth.authenticate(res.headers);
      } else {
        let credentials = getReqAuth(req);
        if (!credentials) {
          return res.set('WWW-Authenticate', 'Basic realm="User Visible Realm"').sendStatus(401);
        }
        authCheck = scope.wsAuth.authenticate(credentials);
      }
    } else {
      authCheck = Promise.resolve();
    }

    authCheck
      .then((u) => {
        if (!u && authMode !== 'none') {
          throw new IonError(errors.ACCESS_DENIED);
        }
        if (u) {
          scope.auth.forceUser(req, u);
        }
      })
      .then(()=>{
        /**
        * @type {Service}
        */
        let s = scope[req.params.service];
        return s.handle(req);
      })
      .then(function (response) {
        if (typeof response === 'object') {
          if (response.hasOwnProperty('headers') && typeof response.headers === 'object') {
            res.set(response.headers);
          }
          if (typeof response.data === 'string' || typeof response.data === 'object') {
            response = response.data;
          }
        }

        res.status(200).send(response);
      }).catch(function (err) {
        if (err instanceof IonError) {
          if (err.code === errors.ACCESS_DENIED) {
            return res.status(403).send(err.message);
          }
        }
        scope.sysLog.error(err);
        res.status(500).send('Internal server error');
      });
  } else {
    res.status(404).send('Service name not found');
  }
};
