const Busboy = require('busboy');

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    let bus;
    try {
      bus = new Busboy({headers: req.headers});
    } catch (err) {
      return resolve(null);
    }

    const data = {};

    bus.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];

      file.on('data', chunk => chunks.push(chunk));

      file.on('end', () => {
        data[fieldname] = {
          name: filename,
          mimeType: mimetype,
          buffer: Buffer.concat(chunks)
        };
      });

      file.on('error', () => {
        data[fieldname] = undefined;
      });
    });

    bus.on('field', (fieldname, val) => {
      data[fieldname] = val;
    });

    bus.on('finish', () => resolve(data));

    bus.on('error', err => reject(err));

    req.pipe(bus);
  });
}

module.exports = parseMultipart;
