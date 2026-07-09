const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  slug: {
    type: String,
    unique: true,
    index: true
  },

  description: {
    type: String,
    required: false
  },

  image: {
    type: String,
    required: false
  },

  isActive: {
    type: Boolean,
    default: true,
    required: false
  }

}, { timestamps: true });

CategorySchema.pre('save', function(next) {
  if (this.isModified('name') && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  next();
});

module.exports = mongoose.model('Category', CategorySchema);