const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: false },
  // 1. Añadimos el slug indexado para búsquedas rápidas por URL
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: false },
  price: { type: Number, required: false },
  box: { type: [Number], required: false },
  stock: { type: Number, default: 0, required: false },

  total_sales: { type: Number, default: 0 },
  
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  images: { type: [String], required: false } 
}, { timestamps: true });
// 2. Middleware (Hook) para autogenerar el slug antes de guardar un producto nuevo
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remueve caracteres especiales
      .replace(/[\s_-]+/g, '-') // Cambia espacios por guiones
      .replace(/^-+|-+$/g, ''); // Quita guiones sobrantes al inicio/final
  }
  next();
});
module.exports = mongoose.model('Product', ProductSchema);
