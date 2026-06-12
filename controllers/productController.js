// controllers/ProductController.js

const Product = require('../models/productModel');
const NewBill = require('../models/newBillModel');
const sharp = require('sharp');
const aws = require('aws-sdk');
const S3 = new aws.S3();

/**
 * GET /api/products/high-stock?limit=10
 * Devuelve los productos con mayor stock disponible.
 */
exports.getHighStockProducts = async (req, res) => {
  try {
    // Leer ?limit=N (por defecto 10)
    const q = req.query.limit;
    const limit = (q && !isNaN(parseInt(q, 10)))
      ? parseInt(q, 10)
      : 10;

    const highStock = await Product.find()
      .sort({ stock: -1 })            // stock descendente (mayor primero)
      .limit(limit)
      .select('name price stock images');

    res.status(200).json({
      success: true,
      message: `Top ${highStock.length} productos con mayor stock`,
      data: highStock
    });
  } catch (err) {
    console.error('Error en getHighStockProducts:', err);
    res.status(500).json({ success: false, error: 'Error al obtener productos con alto stock' });
  }
};

/**
 * GET /api/products/low-stock?limit=10
 * Devuelve los productos con menor stock disponible.
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    // lee el query param
    const q = req.query.limit;
    // intenta parsear a entero en base 10, si no existe o es NaN usa 10
    const limit = (q && !isNaN(parseInt(q, 10)))
      ? parseInt(q, 10)
      : 10;
 
    const lowStock = await Product.find()
      .sort({ stock: 1 })              // stock ascendente (menor primero)
      .limit(limit)
      .select('name price stock images');

    res.status(200).json({
      success: true,
      message: `Top ${lowStock.length} productos con menor stock`,
      data: lowStock
    });
  } catch (err) {
    console.error('Error en getLowStockProducts:', err);
    res.status(500).json({ success: false, error: 'Error al obtener productos con bajo stock' });
  }
};
/**
 * GET /api/products/by-category/:catId
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { catId } = req.params;
   // Ahora, busca dentro del array
    const products = await Product.find({ categories: catId });
    res.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al filtrar productos' });
  }
};

/**
 * GET /api/products/new-arrivals?limit=8
 * Devuelve los productos más recientes, ordenados por fecha de creación descendente.
 */
exports.getNewArrivals = async (req, res) => {
  try {
    // Parámetro opcional ?limit=8 (por defecto 8)
    const limit = parseInt(req.query.limit, 10) || 8;

    const arrivals = await Product.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('name price images updatedAt');

    res.status(200).json({
      success: true,
      message: `Últimas ${arrivals.length} nuevas llegadas`,
      data: arrivals
    });
  } catch (error) {
    console.error('Error en getNewArrivals:', error);
    res.status(500).json({ success: false, error: 'Error al obtener nuevas llegadas' });
  }
};
/**
 * Devuelve los productos con menor volumen de ventas.
 * Query param opcional: ?limit=5 (por defecto 10)
 */
exports.getLeastSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const bottom = await NewBill.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalSold: { $sum: '$products.quantity' }
        }
      },
      // Orden ascendente para los menos vendidos
      { $sort: { totalSold: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
         {
        $lookup: {
          from: 'categories',
          localField: 'product.categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          description: '$product.description',
          price: '$product.price',
          images: '$product.images',
          stock: '$product.stock',    
          box: '$product.box',    
          categories: {
            _id: 1,
            name: 1
          }, 
          totalSold: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: `Top ${bottom.length} productos menos vendidos`,
      data: bottom
    });
  } catch (error) {
    console.error('Error en getLeastSellingProducts:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los productos menos vendidos' });
  }
};

exports.getTopSellingProducts = async (req, res) => {
  try {
    // Permitir un parámetro ?limit=5, por defecto 10
    const limit = parseInt(req.query.limit, 10) || 10;

    const top = await NewBill.aggregate([
      // Desenrolla cada producto de cada factura
      { $unwind: '$products' },
      // Agrupa por ID de producto y suma las cantidades
      {
        $group: {
          _id: '$products.product',
          totalSold: { $sum: '$products.quantity' }
        }
      },
      // Ordena de mayor a menor
      { $sort: { totalSold: -1 } },
      // Limita al top N
      { $limit: limit },
      // Trae datos del producto
      {
        $lookup: {
          from: 'products',             // nombre de la colección en Mongo
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
         {
        $lookup: {
          from: 'categories',
          localField: 'product.categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      // Formatea la salida
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          description: '$product.description',
          price: '$product.price',
          images: '$product.images',
          stock: '$product.stock',    
          box: '$product.box',      
          categories: {
            _id: 1,
            name: 1
          },
          totalSold: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: `Top ${top.length} productos más vendidos`,
      data: top
    });
  } catch (error) {
    console.error('Error en getTopSellingProducts:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los productos más vendidos' });
  }
};

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
// parsear posibles múltiples IDs que vengan como JSON o como cadena CSV
let cats = [];
if (req.body.categories) {
  if (Array.isArray(req.body.categories)) {
    cats = req.body.categories;
  } else if (typeof req.body.categories === 'string') {
    // form-data suele enviar "id1,id2,id3"
    cats = req.body.categories.split(',').map(s => s.trim());
  }
}
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

    // parsear incoming
let cats = product.categories || [];
if (req.body.categories) {
  if (Array.isArray(req.body.categories)) {
    cats = req.body.categories;
  } else {
    cats = req.body.categories.split(',').map(s => s.trim());
  }
}

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        ...req.body,
        images: newUrls.length
          ? [...(product.images||[]), ...newUrls]
          : product.images,
          categories: cats
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

/**
 * GET /api/products/pdp/:slug
 * Devuelve la información unificada del producto optimizada para Marketing (CRO),
 * gestionando el stock agotado e inyectando productos relacionados de forma dinámica.
 */

exports.getProductDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Lectura directa ultra rápida de la DB
    const productData = await Product.findOne({ slug }).populate('categories', 'name');

    if (!productData) {
      return res.status(404).json({ success: false, error: "Producto no encontrado" });
    }

    const product = productData.toObject();
    const availableStock = product.stock || 0;
    const fakeOriginalPrice = product.price ? product.price * 1.25 : 0;

    // 2. Buscar Productos Relacionados Dinámicos (Evita carruseles vacíos)
    let relatedQuery = { _id: { $ne: product._id } }; 
    if (product.categories && product.categories.length > 0) {
      relatedQuery.categories = { $in: product.categories.map(c => c._id) };
    } else if (product.category) {
      relatedQuery.category = product.category; // Fallback para tus strings como "Electrónica"
    }

    const rawRelated = await Product.find(relatedQuery).limit(4).select('name price slug images stock');
    const relatedProducts = rawRelated.map(p => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock_status: p.stock > 0 ? 'in_stock' : 'out_of_stock',
      image: p.images && p.images.length > 0 ? p.images[0] : null
    }));

    // 3. Estructura unificada para la App de Flutter
    const pdpResponse = {
      id: product._id,
      name: product.name,
      slug: product.slug,
      
      pricing: {
        current_price: product.price,
        original_price: parseFloat(fakeOriginalPrice.toFixed(2)),
        discount_percentage: 20,
        currency: 'COP'
      },

      stock_management: {
        status: availableStock > 0 ? (availableStock <= 5 ? 'low_stock' : 'in_stock') : 'out_of_stock',
        available_quantity: availableStock,
        show_low_stock_warning: availableStock > 0 && availableStock <= 5,
        allow_backorder_subscription: availableStock === 0 
      },

      marketing_triggers: {
        total_sales_count: product.total_sales || 0, // Ya no hace agregación, lee directo del documento migrado
        viewers_right_now: Math.floor(Math.random() * (12 - 3 + 1)) + 3,
        badge: availableStock === 0 ? "Agotado temporalmente" : (product.total_sales > 50 ? "Más Vendido" : "Recomendado")
      },

      shipping_logistics: {
        free_shipping_eligible: product.price >= 200000,
        free_shipping_threshold: 200000,
        estimated_delivery_text: availableStock > 0 ? "Recíbelo en 24-48 horas" : "Despacho inmediato al reponer stock",
      },

      seo: {
        meta_title: `Comprar ${product.name} - UDElectronics`,
        meta_description: product.description ? product.description.substring(0, 155).replace(/\n/g, ' ') : ""
      },

      media: {
        primary_image: product.images && product.images.length > 0 ? product.images[0] : null,
        gallery: product.images || []
      },

      details: {
        description: product.description,
        box: product.box || [],
        categories: product.categories,
        category_text: product.category || null
      },

      related_products: relatedProducts
    };

    res.status(200).json({ success: true, data: pdpResponse });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error interno en el servidor" });
  }
};

/**
 * POST /api/products/utils/migrate-slugs-and-sales
 * Función de una sola ejecución para actualizar productos antiguos con su slug y ventas acumuladas.
 */
exports.migrateOldProducts = async (req, res) => {
  try {
    const products = await Product.find();
    let updatedCount = 0;

    console.log(`=== Iniciando Remigración Masiva de ${products.length} productos ===`);

    for (let product of products) {
      
      // 1. Asegurar el slug si por alguna razón faltara
      if (!product.slug && product.name) {
        product.slug = product.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      // 2. Calcular las unidades vendidas cruzando con NewBill
      const salesAggregation = await NewBill.aggregate([
        { $unwind: '$products' },
        { $match: { 'products.product': product._id } },
        { $group: { _id: '$products.product', totalSold: { $sum: '$products.quantity' } } }
      ]);

      const totalSold = salesAggregation.length > 0 ? salesAggregation[0].totalSold : 0;
      
      // 3. PERSISTENCIA: Guardamos el dato calculado físicamente en el documento
      product.total_sales = totalSold;
      
      // Forzamos el guardado en lote
      await product.save();
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `¡Remigración exitosa! Los contadores de ventas y slugs quedaron fijos en ${updatedCount} productos.`
    });

  } catch (error) {
    console.error('Error durante la remigración:', error);
    res.status(500).json({ success: false, error: 'Error en la actualización en lote', details: error.message });
  }
};