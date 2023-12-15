// controllers/ProductController.js

const Product = require('../models/productModel');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, message: "Productos obtenidos con éxito", data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error al obtener los productos" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }
    res.status(200).json({ success: true, message: "Producto obtenido con éxito", data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error al obtener el producto" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, message: "Producto creado con éxito", data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: "Error al crear el producto" });
  }
};

exports.deleteProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }
    res.status(200).json({ success: true, message: "Producto eliminado con éxito", data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error al eliminar el producto" });
  }
};

exports.updateProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedData = req.body; // Los nuevos datos del producto a actualizar
    const product = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }

    res.status(200).json({ success: true, message: "Producto actualizado con éxito", data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error al actualizar el producto" });
  }
};
