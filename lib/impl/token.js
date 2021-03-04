'use strict';
const Service = require('../interfaces/Service');
const { IonError } = require('@iondv/core')
const { Permissions } = require('@iondv/acl-contracts');
const Errors = require('@iondv/web/lib/errors/front-end');

/**
 * @param {{}} options
 * @param {Auth} options.auth
 * @param {WsAuth} options.ws
 * @param {AclProvider} options.acl
 * @constructor
 */
function Token(options) {
  this._route = (router) => {
    this.addHandler(router, '/', 'GET', (req) => {
      let u = options.auth.getUser(req);
      return options.acl.checkAccess(u, 'ws:::gen-ws-token', [Permissions.USE])
        .then((ok) => {
          if (ok) {
            let id = u.id().split('@');
            return options.ws.generateToken(id[0], id[1]);
          }
          throw new IonError(Errors.ACCESS_DENIED);
        });
    });
    return Promise.resolve();
  };
}

Token.prototype = new Service();

module.exports = Token;