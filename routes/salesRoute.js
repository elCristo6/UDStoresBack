const express = require('express');
const router  = express.Router();
const salesController = require('../controllers/salesController');
// Total de ventas en un rango de fechas
// GET /api/sales/total?from=2025-06-01&to=2025-06-30
router.get('/total', salesController.getTotalSalesInRange);
// Total ventas por método en un día concreto
// GET /api/sales/total-by-payment?date=2025-06-28
router.get('/total-by-payment', salesController.getTotalByPaymentMethodsOnDate);

module.exports = router;