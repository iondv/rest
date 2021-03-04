const isBase64 = require('is-base64');
const { IonError } = require('@iondv/core');
const { PropertyTypes } = require('@iondv/meta-model-contracts');
const {
  getEnrichedItem,
  getStorageDir
} = require('@iondv/commons/lib/storageDirectoryParser');
const Errors = require('../errors/backend-errors');

function parseFile(value) {
  if (value && (Buffer.isBuffer(value) || Buffer.isBuffer(value.buffer))) {
    return value;
  } else if (value && typeof value === 'object' && isBase64(value.body)) {
    return {
      name: value.name,
      mimeType: value.mime,
      buffer: Buffer.from(value.body, 'base64')
    };
  } else if (typeof value === 'string' && isBase64(value)) {
    return Buffer.from(value, 'base64');
  }
  return undefined;
}

function uploadFiles(options, className, id, uploads) {
  if (!Object.keys(uploads).length)
    return Promise.resolve();

  const result = {};
  return getEnrichedItem(options, className, id)
    .then((item) => {
      let filePromises = Promise.resolve();
      Object.keys(uploads).forEach((pn) => {
        if (Array.isArray(uploads[pn])) {
          result[pn] = [];
          uploads[pn].forEach((upload) => {
            filePromises = filePromises
              .then(() => getStorageDir(className, id, pn, options, item))
              .then(dir => options.fileStorage.accept(upload, dir))
              .then(file => result[pn].push(file.id));
          });
        } else {
          filePromises = filePromises
            .then(() => getStorageDir(className, id, pn, options, item))
            .then(dir => options.fileStorage.accept(uploads[pn], dir))
            .then((file) => {
              result[pn] = file.id;
            });
        }
      });
      return filePromises;
    })
    .then(() => result);
}

/**
 * @param {{dataRepo: DataRepository, ignoreRefUpdateErrors: Boolean, log: Logger}} options
 * @param {{}} data
 * @param {ClassMeta} cm
 * @param {Function} [onSave]
 * @returns {Promise}
 */
function save(options, data, cm, onSave) {
  let master;
  return prepareUpdates(options, data, cm)
    .then(updates => options.dataRepo.saveItem(cm.getCanonicalName(), null, updates.data, null, null, {})
      .then((result) => {
        if (!result) {
          return null;
        }
        onSave(result);
        master = result;
        return updates.collections;
      }))
    .then(updates => applyCollections(options, master, updates))
    .catch((err) => {
      if (options.ignoreRefUpdateErrors) {
        if (options.log) {
          options.log.warn(err.message);
        }
        return Promise.resolve();
      }
      return Promise.reject(err);
    });
}

/**
 * @param {{dataRepo: DataRepository}} options
 * @param {Item} master
 * @param {{}} updates
 * @returns {Promise.<Item>}
 */
function applyCollections(options, master, updates) {
  if (!options.dataRepo) {
    return Promise.reject(new IonError(Errors.WRONG_OPTIONS, {method: 'applyCollections'}));
  }
  if (!master || !updates) {
    return Promise.resolve();
  }
  let worker = Promise.resolve();
  const props = master.getMetaClass().getPropertyMetas();
  props.forEach((prop) => {
    if (prop.type === PropertyTypes.COLLECTION && Array.isArray(updates[prop.name])) {
      worker = worker.then(() => options.dataRepo.put(master, prop.name, updates[prop.name]));
    }
  });

  return worker.then(() => master);
}

/**
 * @param {{}} options
 * @param {DataRepository} options.dataRepo
 * @param {MetaRepository} options.metaRepo
 * @param {KeyProvider} options.keyProvider
 * @param {{}} [options.storageSettings]
 * @param {{}} data
 * @param {ClassMeta} cm
 * @param {String} [knownId]
 * @returns {Promise}
 */
function prepareUpdates(options, data, cm, knownId) {
  if (!options.dataRepo || !options.metaRepo || !options.keyProvider) {
    return Promise.reject(new IonError(Errors.WRONG_OPTIONS, {method: 'prepareUpdates'}));
  }
  data = data || {};
  const props = cm.getPropertyMetas();
  const uploads = {};
  const collUpdates = {};
  let savers = Promise.resolve();
  let id = knownId;

  if (!id) {
    id = options.keyProvider.keyData(cm, data);
    if (id) {
      id = options.dataRepo.wrap(cm.getCanonicalName(), id).getItemId();
    }
  }

  function onRefSave(pn) {
    return (result) => {
      data[pn] = result.getItemId();
    };
  }

  function onCollElemSave(pn) {
    return (result) => {
      collUpdates[pn].push(result);
    };
  }

  props.forEach((pm) => {
    if (pm.type === PropertyTypes.REFERENCE) {
      if (typeof data[pm.name] === 'object') {
        const tmp = data[pm.name];
        if (pm.backRef && id) {
          tmp[pm.backRef] = id;
        }
        delete data[pm.name];
        savers = savers.then(() => save(options, tmp, pm._refClass, onRefSave(pm.name)));
      }
    } else if (pm.type === PropertyTypes.COLLECTION) {
      const tmp = data[pm.name];
      delete data[pm.name];
      if (Array.isArray(tmp)) {
        tmp.forEach((dt) => {
          if (pm.backRef && id) {
            dt[pm.backRef] = id;
          }
          savers = savers.then(() => save(options, dt, pm._refClass, onCollElemSave(pm.name)));
        });
        collUpdates[pm.name] = [];
      }
    } else if (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE) {
      if (data[pm.name]) {
        const file = parseFile(data[pm.name]);
        delete data[pm.name];
        if (file) {
          uploads[pm.name] = file;
        }
      }
    } else if (pm.type === PropertyTypes.FILE_LIST) {
      const tmp = data[pm.name];
      delete data[pm.name];
      if (Array.isArray(tmp)) {
        uploads[pm.name] = tmp.map(val => parseFile(val)).filter(file => Boolean(file));
      }
    }
  });

  return savers
    .then(() => uploadFiles(options, cm.getCanonicalName(), id, uploads))
    .then((fileIds) => {
      data = Object.assign(data, fileIds);
      return {
        id, data, collections: collUpdates
      };
    });
}

module.exports.applyCollections = applyCollections;
module.exports.prepareUpdates = prepareUpdates;
