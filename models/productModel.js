const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: false },
  description: { type: String, required: false },
  price: { type: Number, required: false },
  box: { type: [Number], required: false },
  stock: { type: Number, default: 0, required: false },
  category: { type: String, required: false },
  images: { type: [String], required: false } 
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
