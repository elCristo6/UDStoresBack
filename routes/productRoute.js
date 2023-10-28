// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/:box', productController.getProductByBox);
router.delete('/:box', productController.deleteProductByBox);
module.exports = router;
