// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../services/s3Upload');// Ruta de prueba para S3
const s3 = require('../config/s3'); // Asegúrate de importar s3
const uploadMemory      = require('../services/multerMemory');

// Ruta de prueba para S3
router.get('/test-s3', async (req, res) => {
  s3.listBuckets((err, data) => {
    if (err) {
      console.error('Error al listar buckets:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, buckets: data.Buckets });
  });
});

// Endpoint de debug para ver qué trae Multer
router.post(
  '/debug',
  uploadMemory.array('images', 5),
  (req, res) => {
    console.log('=== Debug Multer (memory) ===');
    console.log('Headers:', req.headers);
    console.log('Body:',   req.body);
    console.log('Files:',  req.files);
    res.json({ headers: req.headers, body: req.body, files: req.files });
  }
);
// Productos con menor y mayor stock
router.get('/high-stock', productController.getHighStockProducts);
router.get('/low-stock',       productController.getLowStockProducts);
// Filtrar por categoría
router.get('/by-category/:catId', productController.getProductsByCategory);
// Nuevas llegadas
router.get('/new-arrivals', productController.getNewArrivals);
// Muestra los productos más vendidos
router.get('/top-selling', productController.getTopSellingProducts);
// Menos vendidos (para promociones)
router.get('/least-selling', productController.getLeastSellingProducts);

router.get('/', productController.getProducts);
router.post('/', upload.array('images', 5), productController.createProduct);
// Agrega el middleware upload.array('images', 5) para procesar archivos
router.put('/:id', upload.array('images', 5), productController.updateProductById);
// Antes de exportar router, añade:
router.delete('/:id/images', productController.deleteProductImage);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProductById);


module.exports = router;

// Permite subir hasta 5 imágenes con el campo 'images'
//router.post('/', upload.array('images', 5), productController.createProduct);
