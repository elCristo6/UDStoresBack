// controllers/ProductController.js

const Product = require('../models/productModel');
const sharp = require('sharp');
const aws = require('aws-sdk');
const S3 = new aws.S3();



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
    console.log('Archivos recibidos:', req.files);

    // Genera las URLs CloudFront
    const cfDomain = process.env.CLOUDFRONT_DOMAIN;
    const imageUrls = (req.files || []).map(f => {
      // multer-s3 te da f.key = la "key" en S3, p.ej. "products/12345-name.png"
      return `https://${cfDomain}/${f.key}`;
    });

    const productData = {
      ...req.body,
      images: imageUrls
    };

    const product = new Product(productData);
    await product.save();
    res.status(201).json({ success: true, message: "Producto creado con éxito", data: product });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: "Error al crear el producto" });
  }
};

exports.updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, error: "No encontrado" });

    const cfDomain = process.env.CLOUDFRONT_DOMAIN;
    const newUrls = (req.files || []).map(f => `https://${cfDomain}/${f.key}`);

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        ...req.body,
        images: newUrls.length
          ? [...(product.images||[]), ...newUrls]
          : product.images
      },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error al actualizar" });
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
