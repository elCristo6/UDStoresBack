// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: false
  },
  box: {
    type: [Number], // Ahora es un arreglo de números
    required: false
  },
  stock: {
    type: Number,
    default: 0, // Puedes establecer un valor por defecto
    required: false
  },
  category: {
    type: String,
    required: false
  },
},{ timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
