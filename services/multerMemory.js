// services/multerMemory.js
const multer = require('multer');
// Almacenamiento en memoria para procesar con Sharp antes de subir a S3
const uploadMemory = multer({ storage: multer.memoryStorage() });
module.exports = uploadMemory;
