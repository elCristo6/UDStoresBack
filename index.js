// index.js
/*require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const productRoutes = require('./routes/productRoute'); // Importa las rutas del producto
const userRoute = require('./routes/userRoute'); // Importa las rutas del usuario
const billRoute = require('./routes/newBillRoute'); // Importa las rutas del usuario
const categoryRoutes = require('./routes/categoryRoute');
const salesRoutes = require('./routes/salesRoute');
const cartRoute = require('./routes/cartRoute');
const app = express();
const cors = require('cors');


app.use(cors());
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message });
});
const morgan = require('morgan');
app.use(morgan('dev'));

// Middleware
app.use(bodyParser.json());

// Conexión a la base de datos
connectDB();

app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoute)
app.use('/api/newBill', billRoute)
app.use('/api/cart', cartRoute);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
*/


// index.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const productRoutes = require('./routes/productRoute');
const userRoute = require('./routes/userRoute');
const billRoute = require('./routes/newBillRoute');
const categoryRoutes = require('./routes/categoryRoute');
const salesRoutes = require('./routes/salesRoute');
const cartRoute = require('./routes/cartRoute');
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

// 6️⃣ Manejador de errores (AL FINAL)
app.use((err, req, res, next) => {
    console.error("ERROR GLOBAL:", err);
    res.status(500).json({ error: err.message });
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));