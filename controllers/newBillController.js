const User = require('../models/userModel');
const Product = require('../models/productModel');
const NewBill = require('../models/newBillModel');
const Consecutivo = require('../models/consecutivoNewBill');
const Impresion = require('../models/impresionModel');
const Servicio = require('../models/servicioModel');
const moment = require('moment-timezone');

// Establece la zona horaria de Bogotá
const zonaHorariaBogota = 'America/Bogota';

// Calcula el inicio y fin del día en la zona horaria de Bogotá
const inicioDelDia = moment().tz(zonaHorariaBogota).startOf('day').toDate();
const finDelDia = moment().tz(zonaHorariaBogota).endOf('day').toDate();

const getNextSequence = async (name) => {
  const consecutivo = await Consecutivo.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return consecutivo.seq;
};

const handleUserLookupOrCreate = async (userName, userPhone, userEmail, userCC, userDetalles) => {
  let user = await User.findOne({ 
    $or: [
      { phone: userPhone }, 
      { name: userName }
    ] 
  });

  if (!user) {
    user = new User({
      name: userName || 'Usuario Anónimo',
      phone: userPhone || 'Sin Teléfono',
      email: userEmail || `no-email-${Date.now()}@example.com`,
      cc: userCC,
      detalles: userDetalles
    });
    await user.save();
  }
  return user;
};

exports.createBill = async (req, res) => {
  try {
    const consecutivo = await getNextSequence('factura');
    const {
      name, phone, email, cc, detalles, products: productDetails = [], totalAmount, medioPago, cambio, pagaCon,
      impresiones: impresionesData = [], servicio: servicioData = []
    } = req.body;

    if (productDetails.length === 0 && impresionesData.length === 0 && servicioData.length === 0) {
      return res.status(400).json({ success: false, error: "Debe incluir al menos un producto, servicio o impresión en la factura." });
    }

    const user = await handleUserLookupOrCreate(name, phone, email, cc, detalles);

    let stockUpdates = productDetails.map(async ({ productId, quantity: orderedQuantity }) => {
      const product = await Product.findById(productId);
      if (!product || product.stock < orderedQuantity) {
        throw new Error(`Producto no encontrado o stock insuficiente para el producto con ID: ${productId}`);
      }
      product.stock -= orderedQuantity;
      return product.save();
    });

    await Promise.all(stockUpdates);

    let impresionesIds = await Promise.all(impresionesData.map(async (imp) => {
      const nuevaImpresion = new Impresion(imp);
      await nuevaImpresion.save();
      return nuevaImpresion._id;
    }));

    let servicioIds = await Promise.all(servicioData.map(async (serv) => {
      const nuevoServicio = new Servicio(serv);
      await nuevoServicio.save();
      return nuevoServicio._id;
    }));

    const newBill = new NewBill({
      consecutivo,
      user: user._id,
      products: productDetails.map(({ productId, quantity }) => ({ product: productId, quantity })),
      impresiones: impresionesIds,
      servicio: servicioIds,
      totalAmount,
      medioPago,
      cambio,
      pagaCon
    });

    await newBill.save();
    res.status(201).json({ success: true, message: "Nueva factura creada con éxito", data: newBill });
  } catch (error) {
    console.error('Error al crear la nueva factura:', error);
    res.status(500).json({ success: false, error: "Error interno al crear la nueva factura" });
  }
};
/*
exports.getFacturas = async (req, res) => {
  try {
    const facturas = await NewBill.find().populate('products.product impresiones servicio');
    res.status(200).json({ success: true, data: facturas });
  } catch (error) {
    console.error('Error al recuperar las facturas:', error);
    res.status(500).json({ success: false, error: "Error interno al recuperar las facturas" });
  }
};
*/
exports.getFacturas = async (req, res) => {
  try {
    // Calcula el inicio y fin del día en la zona horaria de Bogotá
    const inicioDelDia = moment().tz('America/Bogota').startOf('day').toDate();
    const finDelDia = moment().tz('America/Bogota').endOf('day').toDate();

    // Filtra las facturas que fueron creadas dentro del rango del día actual en Bogotá
    const facturasDelDia = await NewBill.find({
      createdAt: {
        $gte: inicioDelDia,
        $lt: finDelDia
      }
    }).populate('products.product impresiones servicio');

    res.status(200).json({ success: true, data: facturasDelDia });
  } catch (error) {
    console.error('Error al recuperar las facturas del día:', error);
    res.status(500).json({ success: false, error: "Error interno al recuperar las facturas del día" });
  }
};
