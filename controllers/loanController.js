const Loan = require('../models/loanModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const NewBill = require('../models/newBillModel');
const { getNextSequence } = require('../controllers/newBillController'); 
const moment = require('moment-timezone');

// --- PRESTAR (CREA LÍNEA INDEPENDIENTE) ---
exports.addLoanItems = async (req, res) => {
    try {
        const { clientId, items } = req.body;
        const user = await User.findById(clientId);
        if (!user || user.role !== 'store') return res.status(403).json({ success: false, message: "Acceso denegado." });

        const activeLoans = await Loan.find({ status: 'open' });
        let loan = await Loan.findOne({ client: clientId, status: 'open' }) || new Loan({ client: clientId, items: [] });

        for (let item of items) {
            const product = await Product.findById(item.productId);
            
            let totalEnLaCalle = 0;
            activeLoans.forEach(l => {
                l.items.forEach(i => {
                    if (i.product.toString() === item.productId) {
                        totalEnLaCalle += (i.qtyBorrowed - i.qtyReturned);
                    }
                });
            });

            const disponible = product.stock - totalEnLaCalle;

            if (!product || disponible < item.qty) {
                return res.status(400).json({ 
                    success: false, 
                    message: `No puedes prestar ${item.qty} de ${product.name}. Solo hay ${disponible} disponibles.` 
                });
            }

            loan.items.push({ 
                product: item.productId, 
                qtyBorrowed: item.qty, 
                qtyReturned: 0,
                createdAt: moment().tz('America/Bogota').toDate()
            });
        }
        await loan.save();
        res.json({ success: true, message: "Préstamo registrado correctamente." });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- DEVOLVER UNIDAD (Con Auto-Cierre Automático) ---
exports.returnLoanItem = async (req, res) => {
    try {
        const { loanId, itemId, qty } = req.body; 
        const loan = await Loan.findById(loanId);
        
        if (!loan) {
            return res.status(404).json({ success: false, message: "Préstamo no encontrado." });
        }

        const item = loan.items.id(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Línea de préstamo no encontrada." });
        }

        const totalPendiente = item.qtyBorrowed - item.qtyReturned;
        if (qty > totalPendiente) {
            return res.status(400).json({ 
                success: false, 
                message: `No puedes devolver ${qty}. En esta entrega solo se deben ${totalPendiente}.` 
            });
        }

        // 1. Sumamos las unidades devueltas en la línea específica
        item.qtyReturned += qty;

        // 2. Verificamos si TODAS las líneas del préstamo ya están paz y salvo
        const todoDevuelto = loan.items.every(i => i.qtyReturned >= i.qtyBorrowed);

        // 3. Si todo fue devuelto, cerramos el préstamo automáticamente
        if (todoDevuelto) {
            loan.status = 'closed';
        }

        await loan.save();
        
        res.json({ 
            success: true, 
            message: todoDevuelto 
                ? "Devolución completada. ¡El préstamo se ha CERRADO automáticamente al no quedar items pendientes!" 
                : "Devolución registrada correctamente.",
            loanStatus: loan.status,
            isClosed: todoDevuelto
        });
    } catch (err) { 
        res.status(500).json({ success: false, error: err.message }); 
    }
};

// --- OBTENER PRÉSTAMO ACTIVO POR CLIENTE ESPECÍFICO ---
exports.getActiveLoan = async (req, res) => {
    try {
        const loan = await Loan.findOne({ client: req.params.clientId, status: 'open' })
                               .populate('client', 'name phone detalles')
                               .populate('items.product');

        if (!loan) return res.json({ success: true, data: null });

        // Formateamos igual que arriba
        const loanObj = loan.toObject();
        loanObj.items = loanObj.items.map(item => {
            if (!item.product) return item;
            
            const originalPrice = item.product.price || 0;
            const appliedPrice = (item.customPrice !== null && item.customPrice !== undefined) 
                                 ? item.customPrice 
                                 : originalPrice;

            return {
                ...item,
                originalPrice: originalPrice,
                appliedPrice: appliedPrice
            };
        });

        res.json({ success: true, data: loanObj });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- OBTENER TODOS LOS PRÉSTAMOS ACTIVOS (GLOBAL ADMIN) ---
exports.getAllActiveLoansSummary = async (req, res) => {
    try {
        const activeLoans = await Loan.find({ status: 'open' })
            .populate('client', 'name phone detalles') 
            .populate('items.product');

        // Formateamos la respuesta para calcular los precios exactos para Flutter
        const formattedLoans = activeLoans.map(loan => {
            const loanObj = loan.toObject(); // Convertimos de Mongoose Document a objeto plano
            
            loanObj.items = loanObj.items.map(item => {
                // Prevención de errores si un producto fue borrado del catálogo
                if (!item.product) return item;

                const originalPrice = item.product.price || 0;
                
                // Si customPrice existe, usamos ese. Si no, usamos el original.
                const appliedPrice = (item.customPrice !== null && item.customPrice !== undefined) 
                                     ? item.customPrice 
                                     : originalPrice;

                return {
                    ...item,
                    originalPrice: originalPrice,
                    appliedPrice: appliedPrice // <-- Flutter usará este campo directamente
                };
            });
            
            return loanObj;
        });

        res.json({ success: true, data: formattedLoans });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- FINALIZAR A FACTURA (CON FACTURACIÓN PARCIAL O TOTAL) ---
exports.finalizeLoanToBill = async (req, res) => {
    try {
        const { loanId } = req.params;
        // Recibimos los IDs seleccionados que manda Flutter (selectedItemIds)
        const { medioPago, pagaCon, selectedItemIds } = req.body; 
        
        const loan = await Loan.findById(loanId).populate('client').populate('items.product');

        if (!loan || loan.status === 'closed') {
            return res.status(400).json({ success: false, message: "Préstamo no encontrado o ya cerrado." });
        }

        const consecutivo = await getNextSequence('factura');

        let totalAmount = 0;
        const productsMap = {};
        
        // Arreglos para separar la magia parcial
        const itemsToKeep = [];
        const itemsToBillRaw = []; // Guarda las líneas originales que sí se van a cobrar para el clon histórico

        // 1. Agrupación inteligente y separación de productos seleccionados
        loan.items.forEach(i => {
            const pendingQty = i.qtyBorrowed - i.qtyReturned;
            
            // Verificamos si el front nos envió selectedItemIds y si este ítem está incluido
            const isSelected = selectedItemIds && selectedItemIds.length > 0 
                               ? selectedItemIds.includes(i._id.toString()) 
                               : true; // Fallback: Si no mandan nada, asume cobrar todo

            if (pendingQty > 0 && isSelected) {
                // Se va a facturar: Lo guardamos crudo para el clon histórico
                itemsToBillRaw.push(i);

                const pId = i.product._id.toString();
                const appliedPrice = i.customPrice !== null && i.customPrice !== undefined 
                                     ? i.customPrice 
                                     : (i.product.price || 0);
                                     
                const originalPrice = i.product.price || 0;
                
                // Agrupamos en el mapa para la factura (NewBill)
                const groupKey = `${pId}_${appliedPrice}`; 
                
                if (productsMap[groupKey]) {
                    productsMap[groupKey].quantity += pendingQty;
                } else {
                    productsMap[groupKey] = {
                        product: i.product._id,
                        quantity: pendingQty,
                        appliedPrice: appliedPrice,
                        originalPrice: originalPrice
                    };
                }
                totalAmount += (appliedPrice * pendingQty);
            } else {
                // No se va a facturar hoy (o ya estaba en pendiente 0): se queda en el préstamo
                itemsToKeep.push(i);
            }
        });

        const itemsToBill = Object.values(productsMap);

        if (itemsToBill.length === 0) {
            return res.status(400).json({ success: false, message: "No se seleccionaron productos válidos para facturar." });
        }

        // Validación de stock antes de crear nada
        for (let item of itemsToBill) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Stock insuficiente para: ${product?.name}` });
            }
        }

        // 2. Crear Factura Real (NewBill)
        const bill = new NewBill({
            consecutivo,
            user: loan.client._id,
            userName: loan.client.name || 'Sin nombre',
            userPhone: loan.client.phone || 'Sin teléfono',
            userCC: loan.client.cc || 'N/A',
            userDetalles: loan.client.detalles || 'Sin detalles',
            products: itemsToBill, // Productos agrupados limpios
            totalAmount: Number(totalAmount),
            medioPago: medioPago || 'Efectivo',
            pagaCon: Number(pagaCon) || Number(totalAmount),
            cambio: (Number(pagaCon) || Number(totalAmount)) - Number(totalAmount)
        });

        await bill.save();

        // 3. Descontar Stock
        for (let item of itemsToBill) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }

        // 4. ACTUALIZAR EL PRÉSTAMO (FACTURACIÓN PARCIAL)
        // Revisamos si en la bolsa de "los que se quedan" aún hay productos con deudas
        const hasPendingItemsLeft = itemsToKeep.some(i => (i.qtyBorrowed - i.qtyReturned) > 0);

        if (!hasPendingItemsLeft) {
            // El cliente pagó absolutamente todo el préstamo
            loan.status = 'closed';
            await loan.save();
        } else {
            // El cliente pagó PARCIALMENTE
            
            // A. Creamos un "clon" del préstamo, cerrado, con lo que SÍ facturó 
            // Esto asegura que la auditoría histórica cuadre perfectamente.
            const closedLoanCopy = new Loan({
                client: loan.client._id,
                items: itemsToBillRaw, 
                status: 'closed'
            });
            await closedLoanCopy.save();

            // B. Actualizamos el préstamo actual original dejando SOLAMENTE los ítems no pagados
            loan.items = itemsToKeep;
            await loan.save();
        }

        res.json({ success: true, message: "Facturación procesada correctamente.", data: bill });
    } catch (err) { 
        res.status(500).json({ success: false, error: err.message }); 
    }
};




// --- ACTUALIZAR PRECIO DE UNA LÍNEA ESPECÍFICA ---
exports.updateLoanItemPrice = async (req, res) => {
    try {
        const { loanId, itemId, newPrice } = req.body;
        const loan = await Loan.findById(loanId);
        
        if (!loan) return res.status(404).json({ success: false, message: "Préstamo no encontrado." });

        const item = loan.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Línea de préstamo no encontrada." });

        // Actualizamos el precio personalizado
        item.customPrice = newPrice;
        await loan.save();

        res.json({ success: true, message: "Precio de la línea actualizado correctamente." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// --- HISTORIAL DE PRÉSTAMOS CERRADOS ---
exports.getClosedLoansHistory = async (req, res) => {
    try {
        const closedLoans = await Loan.find({ status: 'closed' })
            .populate('client', 'name phone detalles')
            .populate('items.product') // <-- Trae el objeto completo de producto sin restricciones
            .sort({ updatedAt: -1 }); 

        res.json({ success: true, data: closedLoans });
    } catch (err) { res.status(500).json({ error: err.message }); }
};