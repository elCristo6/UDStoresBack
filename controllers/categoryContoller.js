const Category = require('../models/categoryModel');
const Product  = require('../models/productModel');

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const cat = new Category({ name, description });
    await cat.save();
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener categorías' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener categoría' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const updates = (({ name, description }) => ({ name, description }))(req.body);
    const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!cat) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    // Antes de borrar: opcionalmente, verificar si hay productos con esa categoría
    const productos = await Product.find({ category: req.params.id }).limit(1);
    if (productos.length)
      return res.status(400).json({ success: false, error: 'No se puede eliminar: existen productos asociados' });

    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al borrar categoría' });
  }
};