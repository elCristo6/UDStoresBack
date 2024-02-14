// Importación de los modelos necesarios.
const User = require('../models/userModel');
const Product = require('../models/productModel');
const NewBill = require('../models/newBillModel');
const Consecutivo = require('../models/consecutivoNewBill'); // Asegúrate de que la ruta sea correcta

const getNextSequence = async (name) => {
  const consecutivo = await Consecutivo.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return consecutivo.seq;
};
// Función modificada para buscar o crear un usuario.

const handleUserLookupOrCreate = async (userName, userPhone, userEmail,userCC,userDetalles) => {
  let user = null;

  // Busca primero por teléfono, luego por nombre
  if (userPhone) {
    user = await User.findOne({ phone: userPhone });
  } else if (userName === 'mostrador') {
    user = await User.findOne({ name: 'mostrador' });
  }

  // Crear un nuevo usuario si no se encuentra uno
  if (!user) {
    const newUser = {
      name: userName || 'Usuario Anónimo',
      phone: userPhone || 'Sin Teléfono',
      cc:userCC,
      detalles: userDetalles
    };

    // Genera un email único si no se proporciona
    newUser.email = userEmail || `no-email-${Date.now()}@example.com`;

    user = new User(newUser);
    await user.save();
  }

  return user;
};


// Exporta la función createBill, que es un controlador para manejar la creación de facturas.
exports.createBill = async (req, res) => {
  try {

    const consecutivo = await getNextSequence('factura');
     // Extrae los datos necesarios de la solicitud.
    const { name, phone, email, cc, detalles, products: productDetails, totalAmount , medioPago, cambio, pagaCon} = req.body;
    // Usa la función handleUserLookup para buscar un usuario.
    const user = await handleUserLookupOrCreate(name, phone,email,cc,detalles);
    // Si no se encuentra un usuario, envía un mensaje de error.
    if (!user) {
      console.error(`Usuario no encontrado para name: ${name}, phone: ${phone}`);
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }
    // Array para almacenar promesas de actualización de stock.
    const stockUpdates = [];
    // Itera sobre cada producto en la solicitud.
    for (const detail of productDetails) {
      // Extrae el ID del producto y la cantidad ordenada.
      const { productId: productID, quantity: orderedQuantity } = detail;
      console.log(`Buscando producto con ID: ${productID}`);

       // Valida si el ID del producto es válido.
      if (!productID || typeof productID !== 'string') {
        console.error(`ID de producto no válido: ${productID}`);
        return res.status(400).json({ success: false, error: `ID de producto no válido: ${productID}` });
      }
      // Busca el producto en la base de datos.
      const product = await Product.findById(productID);
      // Si no se encuentra el producto, envía un mensaje de error.
      if (!product) {
        console.error(`Producto no encontrado con ID: ${productID}`);
        return res.status(404).json({ success: false, error: `Producto no encontrado con ID: ${productID}` });
      }
       // Verifica si hay suficiente stock del producto.
      if (product.stock < orderedQuantity) {
        console.error(`No hay suficiente stock para el producto con ID: ${productID}`);
        return res.status(400).json({ success: false, error: `No hay suficiente stock para el producto con ID: ${productID}` });
      }
      // Actualiza el stock del producto.
      product.stock -= orderedQuantity;
      // Añade la promesa de guardar el producto actualizado al array.
      stockUpdates.push(product.save());
    }
     // Espera a que todas las actualizaciones de stock se completen.
    await Promise.all(stockUpdates);
    // Crea una nueva factura con los detalles proporcionados y la asocia al usuario.
    const newBill = new NewBill({ 
      consecutivo,
      user: user._id, 
      userPhone:user.phone,
      userEmail: user.email ? user.email : undefined,
      userName:user.name, 
      userDetalles: user.detalles,
      userCC: user.cc,
      products: productDetails.map(detail => ({ product: detail.productId, quantity: detail.quantity })), 
      totalAmount,
      medioPago, 
      cambio,   
      pagaCon  
    });
    // Guarda la nueva factura en la base de datos.
    await newBill.save();

    // Envía una respuesta exitosa con los detalles de la nueva factura.
    console.log('Nueva factura creada con éxito:', newBill);
    res.status(201).json({ success: true, message: "Nueva factura creada con éxito", data: newBill });
  } catch (error) {
      // Maneja cualquier error que ocurra durante el proceso.
    console.error('Error al crear la nueva factura:', error);
    res.status(500).json({ success: false, error: "Error interno al crear la nueva factura" });
  }
};


exports.getFacturas = async (req, res) => {
    try {
        // Aquí puedes agregar lógica para paginación, filtros, etc.
        const facturas = await NewBill.find(); // Obtén todas las facturas

        res.status(200).json({
            success: true,
            data: facturas
        });
    } catch (error) {
        console.error('Error al recuperar las facturas:', error);
        res.status(500).json({ success: false, error: "Error interno al recuperar las facturas" });
    }
};

