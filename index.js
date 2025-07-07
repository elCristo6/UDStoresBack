// index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const productRoutes = require('./routes/productRoute'); // Importa las rutas del producto
const userRoute = require('./routes/userRoute'); // Importa las rutas del usuario
const billRoute = require('./routes/newBillRoute'); // Importa las rutas del usuario
const categoryRoutes = require('./routes/categoryRoute');
const salesRoutes = require('./routes/salesRoute');

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
