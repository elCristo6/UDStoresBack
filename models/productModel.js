// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  box: {
    type: [Number], // Ahora es un arreglo de números
    //required: true
  },
  stock: {
    type: Number,
    default: 0, // Puedes establecer un valor por defecto
  },
  category: {
    type: String,
    required: true
  },
},{ timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
