// routes/billRoute.js
const express = require('express');
const router = express.Router();
const newBillController = require('../controllers/newBillController');
const Consecutivo = require('../models/consecutivoNewBill');

router.post('/', newBillController.createBill);
router.get('/', newBillController.getFacturas);
// routes/newBillRoute.js
router.get('/next-consecutivo', async (req, res) => {
    const doc = await Consecutivo.findById('factura');
    res.json({ nextFactura: doc ? doc.seq + 1 : 1 });
  });
  
// Agrega otras rutas según tus necesidades.

module.exports = router;
