// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 06.07.16.
 */
const express = require('express');
const { di } = require('@iondv/core');
const { utils: { extendDi } } = require('@iondv/commons');

const config = require('./config');
const pre = require('./prehandle');
const Service = require('./lib/interfaces/Service');

const app = express();

const alias = di.alias;

app._init = (moduleName) => {
  /**
   * @type {{settings: SettingsRepository, auth: Auth, sessionHandler: SessionHandler, tokenAuth: TokenAuth}}
   */
  const rootScope = di.context('app');

  rootScope.auth.exclude(`\\/${moduleName}\\/\\w.*`);
  rootScope.sessionHandler.exclude(`${moduleName}/**`);

  return di(
    moduleName,
    extendDi(moduleName, config.di),
    {module: app},
    'app'
  )
    .then(scope => alias(scope, scope.settings.get(`${moduleName}.di-alias`)))
    .then((scope) => {
      app.get('/', (req, res) => {
        res.send('Ion DV REST interface');
      });
      app.use(`/:service`, pre(moduleName));
      Object.keys(scope).forEach((nm) => {
        if (scope[nm] instanceof Service) {
          const router = express.Router();
          scope[nm].route(router);
          app.use(`/${nm}`, router);
        }
      });
    });
};

module.exports = app;
