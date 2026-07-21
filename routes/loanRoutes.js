const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.post('/add-items', loanController.addLoanItems);      // Para varios productos
router.patch('/return-item', loanController.returnLoanItem); // Para devolver
router.get('/active/:clientId', loanController.getActiveLoan);
router.get('/active-all', loanController.getAllActiveLoansSummary);
router.post('/finalize/:loanId', loanController.finalizeLoanToBill);
module.exports = router;