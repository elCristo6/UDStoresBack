
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3');

function makeSafeFilename(name) {
  return name
    .trim()
    .toLowerCase()
    // reemplaza espacios por guiones
    .replace(/\s+/g, '-')
    // elimina caracteres extraños
    .replace(/[^a-z0-9\-\.]/g, '');
}

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    // Asigna inline para que el navegador renderice la imagen, no la descargue
    contentDisposition: (_req, file, cb) => cb(null, 'inline'),
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const safeName = makeSafeFilename(file.originalname);
      const fileName = `products/${Date.now()}-${safeName}`;
      console.log("Procesando archivo:", fileName);
      cb(null, fileName);
    }
  })
});

module.exports = upload;
