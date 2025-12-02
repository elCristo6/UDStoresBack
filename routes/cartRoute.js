// routes/cartRoute.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, cartController.getCart);
router.post('/add', verifyToken, cartController.addToCart);
router.post('/remove', verifyToken, cartController.removeFromCart);
router.post('/clear', verifyToken, cartController.clearCart);

module.exports = router;