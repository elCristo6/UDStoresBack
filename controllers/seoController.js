// controllers/seoController.js
const Product = require('../models/productModel');

/**
 * GET /sitemap.xml
 * Genera de forma 100% automatizada el mapa del sitio XML leyendo tu MongoDB en tiempo real.
 */
exports.generateSitemap = async (req, res) => {
  try {
    // 1. Obtener todos los productos activos que tengan un slug válido
    const products = await Product.find({ slug: { $exists: true, $ne: "" } })
                                  .select('slug updatedAt');

    const baseUrl = 'https://udelectronics.com';

    // 2. Encabezado obligatorio del formato XML de Sitemaps
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 3. Añadir las páginas principales estáticas de tu tienda
    xml += `  <url>\n    <loc>${baseUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // 4. Inyectar dinámicamente los 792 productos con sus URLs puras
    products.forEach(product => {
      // Usamos la fecha de actualización para decirle a Google cuándo cambió el componente
      const lastMod = product.updatedAt ? product.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/${product.slug}</loc>\n`; // URL Pura en la raíz
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    // 5. Configurar los Headers correctos para que el navegador y Google sepan que es un XML
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);

  } catch (error) {
    console.error('Error al generar el sitemap dinámico:', error);
    res.status(500).send('Error interno al construir el mapa del sitio');
  }
};