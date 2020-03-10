/**
 * Created by kras on 21.09.16.
 */
'use strict';

const moduleName = require('./module-name');
const di = require('core/di');
const IonError = require('core/IonError');
const errors = require('core/errors/front-end');
const base64 = require('base64-js');
const isBase64 = require('is-base64');

function getAuthValue(val) {
  return isBase64(val) ? Buffer.from(base64.toByteArray(val)).toString('utf-8') : val;
}

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
      let credentials = auth.match(/^(Basic|Bearer)\s+([^\s]+)/);
      if (credentials && credentials.length > 2) {
        switch (credentials[1]) {
          case 'Bearer':
            result.token = credentials[2];
            break;
          case 'Basic':
            auth = getAuthValue(credentials[2]).split(':');
            result.user = auth[0];
            result.pwd = auth.length > 1 ? auth[1] : null;
            break;
          default:
            break;
        }
      }
    }
  }
  if (!result.pwd && !result.token) {
    return null;
  }
  return result;
}

module.exports = (req, res, next) => {
  /**
   * @type {{metaRepo: MetaRepository, sysLog: Logger, settings: SettingsRepository}}
   */
  const scope = di.context(moduleName);

  if (scope.hasOwnProperty(req.params.service)) {
    let authModes = scope.settings.get(moduleName + '.authMode') || {};
    let authMode = 'pwd';
    if (authModes.hasOwnProperty(req.params.service)) {
      authMode = authModes[req.params.service];
    }

    let authCheck = null;
    if (authMode !== 'none') {
      switch (authMode) {
        case 'token':
        case 'pwd':
        {
          let credentials = getReqAuth(req);
          if (
            !credentials ||
            (authMode == 'pwd' && (!credentials.user || !credentials.pwd)) ||
            (authMode == 'token' && !credentials.token)
          ) {
            return res.set('WWW-Authenticate', 'Basic realm="User Visible Realm"').sendStatus(401);
          }
          authCheck = scope.wsAuth.authenticate(credentials);
        }
          break;
        case 'oauth':
          authCheck = scope.oauth.authenticate(req);
          break;
        default:
          return res.sendStatus(401);
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
        next();
      })
      .catch((err) => {
        if (err instanceof IonError) {
          if (err.code === errors.ACCESS_DENIED) {
            return res.status(403).send(err.message);
          }
        }
        res.sendStatus(401);
      });
  } else {
    res.status(404).send('Service not found');
  }
};
