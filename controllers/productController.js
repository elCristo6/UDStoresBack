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
    console.log('req.files:', req.files);

    // Genera las URLs CloudFront
    const cfDomain = process.env.CLOUDFRONT_DOMAIN;
    console.log('CF_DOMAIN:', cfDomain);
    const imageUrls = (req.files || []).map(f => {
      // multer-s3 te da f.key = la "key" en S3, p.ej. "products/12345-name.png"
      console.log('>> f.key =', f.key);
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


exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "Debes enviar imageUrl en el body." });
    }

    // 1) Extrae la key de S3 a partir de la URL de CloudFront
    const cfDomain = process.env.CLOUDFRONT_DOMAIN;
    const prefix = `https://${cfDomain}/`;
    if (!imageUrl.startsWith(prefix)) {
      return res.status(400).json({ success: false, error: "La URL no corresponde al dominio de CloudFront." });
    }
    const key = imageUrl.substring(prefix.length); // p.ej. "products/1747328698003-img.png"

    // 2) Borra el objeto de S3
    await S3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    }).promise();

    // 3) Actualiza el documento Mongo: quita esa URL del array images
    const updated = await Product.findByIdAndUpdate(
      id,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Producto no encontrado." });
    }

    res.json({
      success: true,
      message: "Imagen eliminada con éxito",
      data: updated
    });
  } catch (err) {
    console.error('Error al eliminar imagen:', err);
    res.status(500).json({ success: false, error: "Error interno al eliminar la imagen." });
  }
};
