// routes/billRoute.js
const express = require('express');
const router = express.Router();
const newBillController = require('../controllers/newBillController');

router.post('/', newBillController.createBill);
router.get('/', newBillController.getFacturas);
// Agrega otras rutas según tus necesidades.

module.exports = router;
