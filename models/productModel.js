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


// models/productModel.js

// 2. Middleware (Hook) avanzado para autogenerar el slug perfecto para SEO y Marketing
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      // 1. Remplazar caracteres con acentos/tildes por letras limpias
      .normalize('NFD') 
      .replace(/[\u0300-\u036f]/g, '') // Separa y elimina las tildes de las letras
      // 2. Tratar de forma específica la ñ si quedara algún residuo
      .replace(/ñ/g, 'n') 
      // 3. Limpieza estándar de caracteres especiales y guiones
      .replace(/[^\w\s-]/g, '') // Remueve cualquier otro símbolo extraño
      .replace(/[\s_-]+/g, '-') // Cambia espacios y guiones bajos por un solo guion
      .replace(/^-+|-+$/g, ''); // Remueve guiones sobrantes al inicio o al final
  }
  next();
});
module.exports = mongoose.model('Product', ProductSchema);
