//newBillModel
const mongoose = require('mongoose');

const NewBillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: { // Añadir campo para el nombre del usuario
    type: String,
    required: false // Puede ser opcional dependiendo de tus necesidades
  },
  userPhone: { // Añadir campo para el teléfono del usuario
    type: String,
    required: false // Puede ser opcional dependiendo de tus necesidades
  },
  userEmail: { // Añadir campo para el teléfono del usuario
    type: String,
    required: false // Puede ser opcional dependiendo de tus necesidades
  },
  userCC: {
    type: String,
    required: false, // Ajusta según la necesidad de tu aplicación
  },
  userDetalles: {
    type: String,
    required: false, // Ajusta según la necesidad de tu aplicación
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      appliedPrice: { // nuevo campo para el precio usado en la venta
        type: Number,
        required: true
      },
      originalPrice: { // opcional: precio base del producto en ese momento
        type: Number,
        required: false
      }
    }
  ],
  servicio:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Servicio',
      required:false
    }
  ],
  impresiones:[
   {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Impresion',
      required:false
   }
  ],
  medioPago: {
    type: String,
    required: false // Cambia a false si el campo puede ser opcional
  },
  cambio: {
    type: Number,
    required: false // Establece si este campo es obligatorio o no
  },
  pagaCon: {
    type: Number,
    required: false // Establece si este campo es obligatorio o no
  },
  totalAmount: {
    type: Number,
    required: true
  },
  consecutivo: { // Campo para el número de consecutivo
    type: Number,
    required: true
  },
  // Otros campos relevantes para la factura
}, { timestamps: true });

module.exports = mongoose.model('NewBill', NewBillSchema);
