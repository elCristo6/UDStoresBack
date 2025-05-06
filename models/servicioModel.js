// models/servicioModel.js
const mongoose = require('mongoose');

const ServicioSchema = new mongoose.Schema({
  
  nombreServicio: {
    type: String,
    required: false
  },
  descripcionServicio: {
    type: String, // Ahora es un arreglo de números
    required: false
  },
  precioServicio: {
    type: Number,
    required: false
  },
  
},{ timestamps: true });

module.exports = mongoose.model('Servicio', ServicioSchema);
