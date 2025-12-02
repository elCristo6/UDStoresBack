// controllers/cartController.js
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.status(200).json({ items: [] });
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, appliedPrice } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      if (appliedPrice) existingItem.appliedPrice = appliedPrice;
    } else {
      cart.items.push({ product: productId, quantity, appliedPrice });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({ message: 'Producto agregado al carrito', cart });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({ message: 'Producto eliminado del carrito', cart });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json({ message: 'Carrito limpiado con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error al limpiar el carrito' });
  }
};