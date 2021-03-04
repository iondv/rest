/**
 * Created by kras on 21.09.16.
 */
const { PropertyTypes } = require('@iondv/meta-model-contracts');
const { IonError } = require('@iondv/core');

const Errors = require('../../errors/backend-errors');
const Service = require('../interfaces/Service');

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
   * @return {Promise}
   */
  function collectionWriter(master, collection, itemsClass, ids) {
    return options.dataRepo
      .getList(itemsClass.getCanonicalName(), {filter: {[itemsClass.getKeyProperties()[0]]: {$in: ids}}})
      .then(details => options.dataRepo.put(master, collection, details));
  }

  /**
   * @param {String} cn
   * @param {String} id
   * @param {{}} updates
   * @param {String} cv
   * @return {Promise}
   */
  function saver(cn, id, updates, cv) {
    const collections = {};
    const cm = options.metaRepo.getMeta(cn);

    for (const nm in updates) {
      if (updates.hasOwnProperty(nm)) {
        const pm = cm.getPropertyMeta(nm);
        if (pm && pm.type === PropertyTypes.COLLECTION) {
          collections[nm] = {
            classMeta: pm._refClass,
            items: updates[nm]
          };
        }
      }
    }

    return options.dataRepo
      .saveItem(cn, id, updates, cv, null, {nestingDepth: 0, autoAssign: true})
      .then((master) => {
        let colWriters = Promise.resolve();

        for (let attr in collections) {
          if (collections.hasOwnProperty(attr)) {
            colWriters = colWriters
              .then(() => collectionWriter(
                master,
                attr,
                collections[attr].classMeta,
                collections[attr].items
              ));
          }
        }

        return colWriters.then(() => master);
      });
  }

  this._route = function (router) {
    this.addHandler(router, '/', 'POST', (req) => {
      try {
        const data = req.body;
        if (!data || (typeof data !== 'object')) {
          throw new IonError(400, {}, new Error('Bad request'));
        }
        const converterName = req.get('ion-converter');
        let reqConverter = null;
        let resConverter = null;

        if (converterName) {
          if (options.hasOwnProperty(converterName)) {
            const c = options[converterName];

            if (typeof c.parse === 'function')
              reqConverter = c.parse(data);

            if (typeof c.respond === 'function') {
              resConverter = function (items) {
                return c.respond(items);
              };
            }
          } else {
            return Promise.reject(new IonError(Errors.NOT_FOUND_CONV));
          }
        }

        if (!reqConverter) {
          reqConverter = Promise.resolve(Array.isArray(data) ? data : [data]);
        }

        if (!resConverter) {
          resConverter = (items) => {
            const result = [];
            items.forEach((item) => {
              let tmp = item.base;
              tmp._id = item.getItemId();
              result.push(tmp);
            });
            return Promise.resolve({data: result});
          };
        }

        return reqConverter
          .then((datas) => {
            let writers = Promise.resolve();
            const results = [];
            datas.forEach((d) => {
              if (typeof d === 'object' && d) {
                const id = d._id;
                const cn = d._class;
                const cv = d._classVer;

                delete d._id;
                delete d._class;
                delete d._classVer;

                writers = writers
                  .then(() => saver(cn, id, d, cv))
                  .then((item) => {
                    results.push(item);
                  });
              }
            });

            return writers.then(() => results).then(resConverter);
          });
      } catch (err) {
        return Promise.reject(err);
      }
    });
    return Promise.resolve();
  };
}

Acceptor.prototype = new Service();

module.exports = Acceptor;

