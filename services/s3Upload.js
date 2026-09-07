
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
    bucket: process.env.AWS_MEDIA_BUCKET_NAME || 'udelectronics-media',
    // Asigna inline para que el navegador renderice la imagen, no la descargue
    contentDisposition: (_req, file, cb) => cb(null, 'inline'),
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // 1. Recibe el nombre de la tienda desde el frontend. 
      // Si no viene, usa 'udelectronics' por defecto para evitar errores.
      const storeId = req.body.storeId || 'udelectronics';
     const safeName = makeSafeFilename(file.originalname);
      
      // 2. Crea la ruta dinámica en S3 (Ej: ardurobotics/products/12345-foto.png)
      const fileName = `${storeId}/products/${Date.now()}-${safeName}`;
      console.log("Subiendo archivo a nueva ruta:", fileName);
      cb(null, fileName);
    }
  })
});

module.exports = upload;
