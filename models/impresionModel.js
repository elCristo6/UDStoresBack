// models/ImpresionModel.js
const mongoose = require('mongoose');

const ImpresionSchema = new mongoose.Schema({
  
  descripcionImpresion: {
    type: String,
    required: false
  },
  pesoImpresion: {
    type: Number, 
    required: false
  },
  valorGramo: {
    type: Number,
    required: false
  },
  totalImpresion: {
    type: Number,
    required: false
  },
  
},{ timestamps: true });

module.exports = mongoose.model('Impresion', ImpresionSchema);
