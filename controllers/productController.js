
// controllers/ProductController.js

const Product = require('../models/productModel');

exports.getProducts = async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los productos" });
    }
  };
  
  exports.getProductByBox = async (req, res) => {
    try {
      const product = await Product.findOne({ box: req.params.box });
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el producto" });
    }
  };

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.deleteProductByBox = async (req, res) => {
    try {
      const product = await Product.findOneAndDelete({ box: req.params.box });
      if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar el producto" });
    }
  };

// Agregar más métodos para manejar otros endpoints aquí.
