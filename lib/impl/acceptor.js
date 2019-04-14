/**
 * Created by kras on 21.09.16.
 */
'use strict';

const Service = require('../interfaces/Service');
const PropertyTypes = require('core/PropertyTypes');

/**
 * @param {{dataRepo: DataRepository, metaRepo: MetaRepository}} options
 * @constructor
 */
function Acceptor(options) {

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {ClassMeta} itemsClass
   * @param {String[]} ids
   * @returns {Promise}
   */
  function collectionWriter(master, collection, itemsClass, ids) {
    return new Promise(function (resolve, reject) {
      var f = {};
      f[itemsClass.getKeyProperties()[0]] = {$in: ids};
      options.dataRepo.getList(itemsClass.getCanonicalName(), {filter: f}).
      then(
        function (details) {
          return options.dataRepo.put(master, collection, details);
        }
      ).
      then(resolve).
      catch(reject);
    });
  }

  /**
   * @param {String} cn
   * @param {String} id
   * @param {{}} updates
   * @param {String} cv
   * @returns {Promise}
   */
  function saver(cn, id, updates, cv) {
    return new Promise(function (resolve, reject) {
      var collections = {};

      var cm = options.metaRepo.getMeta(cn);
      var pm, icm;

      for (var nm in updates) {
        if (updates.hasOwnProperty(nm)) {
          pm = cm.getPropertyMeta(nm);
          if (pm && pm.type === PropertyTypes.COLLECTION) {
            icm = options.metaRepo.getMeta(pm.itemsClass, null, cm.getNamespace());
            collections[nm] = {
              classMeta: icm,
              items: updates[nm]
            };
          }
        }
      }

      options.dataRepo.saveItem(cn, id, updates, cv, null, {nestingDepth: 0, autoAssign: true}).
      then(function (master) {
        return new Promise(function (rs, rj) {
          var colWriters = [];

          for (var attr in collections) {
            if (collections.hasOwnProperty(attr)) {
              colWriters.push(
                collectionWriter(
                  master,
                  attr,
                  collections[attr].classMeta,
                  collections[attr].items
                )
              );
            }
          }

          if (colWriters.length) {
            Promise.all(collections).then(function () {
              rs(master);
            }).catch(rj);
            return;
          }
          rs(master);
        });
      }).catch(reject);
    });
  }

  /**
   * @param {Request} req
   * @returns {Promise}
   * @private
   */
  this._handle = function (req) {
    return new Promise(function (resolve, reject) {
      try {
        var data = req.body;

        var convertorName = req.get('ion-convertor');

        var reqConvertor = null;
        var resConvertor = null;

        if (convertorName) {
          if (options.hasOwnProperty(convertorName)) {
            var c = options[convertorName];

            if (typeof c.parse === 'function') {
              reqConvertor = c.parse(data);
            }

            if (typeof c.respond === 'function') {
              resConvertor = function (items) {
                return c.respond(items);
              };
            }
          } else {
            reject(new Error('In request did not found setting convertor'));
          }
        }

        if (!reqConvertor) {
          reqConvertor = new Promise(function (rslv) {
            if (!Array.isArray(data)) {
              rslv([data]);
            } else {
              rslv(data);
            }
          });
        }

        if (!resConvertor) {
          resConvertor = function (items) {
            return new Promise(function (rslv) {
              var result = [];
              var tmp;
              for (var i = 0; i < items.length; i++) {
                tmp = items[i].base;
                tmp._id = items[i].getItemId();
                result.push(tmp);
              }
              rslv({data: result});
            });
          };
        }

        reqConvertor.then(function (datas) {
          var writers = [];
          for (var i = 0; i < datas.length; i++) {
            if (typeof datas[i] === 'object' && datas[i]) {
              var id = datas[i]._id;
              var cn = datas[i]._class;
              var cv = datas[i]._classVer;

              delete datas[i]._id;
              delete datas[i]._class;
              delete datas[i]._classVer;

              writers.push(saver(cn, id, datas[i], cv));
            }
          }

          Promise.all(writers).then(resConvertor).then(resolve).catch(reject);
        }).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  };
}

Acceptor.prototype = new Service();

module.exports = Acceptor;

