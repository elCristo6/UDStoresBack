// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.put('/:id', productController.updateProductById)
router.post('/', productController.createProduct);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProductById);
module.exports = router;
