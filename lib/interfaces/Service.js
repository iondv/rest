/**
 * Created by kras on 21.09.16.
 */
'use strict';

function Service() {
  /**
   * @param {Request} req
   * @returns {Promise}
   */
  this.handle = function (req) {
    return this._handle(req);
  };
}

module.exports = Service;

