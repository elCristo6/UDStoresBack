
// index.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const seoController = require('./controllers/seoController');
const productRoutes = require('./routes/productRoute');
const userRoute = require('./routes/userRoute');
const billRoute = require('./routes/newBillRoute');
const categoryRoutes = require('./routes/categoryRoute');
const salesRoutes = require('./routes/salesRoute');
const cartRoute = require('./routes/cartRoute');
const loanRoutes = require('./routes/loanRoutes');

const cors = require('cors');
const morgan = require('morgan');

const app = express();

// 1️⃣ CORS
app.use(cors());

// 2️⃣ JSON parser con límite ALTO
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 3️⃣ Logger
app.use(morgan('dev'));

// 4️⃣ Conectar DB
connectDB();

// 5️⃣ Rutas
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoute);
app.use('/api/newBill', billRoute);
app.use('/api/cart', cartRoute);
app.use('/api/loans', loanRoutes);

// =========================================================================
// SITEMAP AUTOMÁTICO PARA BUSCADORES
// =========================================================================
app.get('/sitemap.xml', seoController.generateSitemap);

// Servir la compilación de tu Frontend (Flutter Web)
app.use(express.static('public_html'));

// Regla Catch-All para URLs puras sin carpetas intermedias de Flutter Web
app.get('*', (req, res) => {
  if (req.url.includes('.') || req.url.startsWith('/api')) {
    return res.status(404).send('No encontrado');
  }
  res.sendFile(path.join(__dirname, 'public_html', 'index.html'));
});

// 6️⃣ Manejador de errores (AL FINAL)
app.use((err, req, res, next) => {
    console.error("ERROR GLOBAL:", err);
    res.status(500).json({ error: err.message });
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));