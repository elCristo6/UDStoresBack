const User = require('../models/userModel');
const Product = require('../models/productModel');
const NewBill = require('../models/newBillModel');

const handleUserLookup = async (userName, userPhone) => {
  if (userName === 'mostrador') {
    return await User.findOne({ name: 'mostrador' });
  } else if (userPhone) {
    return await User.findOne({ phone: userPhone });
  }
  return null;
};

exports.createBill = async (req, res) => {
  try {
    const { name, phone, products: productDetails, totalAmount } = req.body;

    const user = await handleUserLookup(name, phone);

    if (!user) {
      console.error(`Usuario no encontrado para name: ${name}, phone: ${phone}`);
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const stockUpdates = [];

    for (const detail of productDetails) {
      const { productId: productID, quantity: orderedQuantity } = detail;
      console.log(`Buscando producto con ID: ${productID}`);

      if (!productID || typeof productID !== 'string') {
        console.error(`ID de producto no válido: ${productID}`);
        return res.status(400).json({ success: false, error: `ID de producto no válido: ${productID}` });
      }

      const product = await Product.findById(productID);

      if (!product) {
        console.error(`Producto no encontrado con ID: ${productID}`);
        return res.status(404).json({ success: false, error: `Producto no encontrado con ID: ${productID}` });
      }

      if (product.stock < orderedQuantity) {
        console.error(`No hay suficiente stock para el producto con ID: ${productID}`);
        return res.status(400).json({ success: false, error: `No hay suficiente stock para el producto con ID: ${productID}` });
      }

      product.stock -= orderedQuantity;
      stockUpdates.push(product.save());
    }

    await Promise.all(stockUpdates);

    const newBill = new NewBill({ user: user._id, products: productDetails.map(detail => ({ product: detail.productId, quantity: detail.quantity })), totalAmount });
    await newBill.save();

    console.log('Nueva factura creada con éxito:', newBill);
    res.status(201).json({ success: true, message: "Nueva factura creada con éxito", data: newBill });
  } catch (error) {
    console.error('Error al crear la nueva factura:', error);
    res.status(500).json({ success: false, error: "Error interno al crear la nueva factura" });
  }
};
