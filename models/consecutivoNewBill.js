// models/ConsecutivoNewBill.js

const mongoose = require('mongoose');

const ConsecutivoSchema = new mongoose.Schema({
  _id: String, // Identificador, como 'factura'
  seq: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Consecutivo', ConsecutivoSchema);
