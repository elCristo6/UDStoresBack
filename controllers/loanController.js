const Loan = require('../models/loanModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const NewBill = require('../models/newBillModel');
const { getNextSequence } = require('../controllers/newBillController'); 


// --- PRESTAR (Solo registra, con validación de stock físico) ---
exports.addLoanItems = async (req, res) => {
    try {
        const { clientId, items } = req.body;
        const user = await User.findById(clientId);
        if (!user || user.role !== 'store') return res.status(403).json({ success: false, message: "Acceso denegado." });

        // 1. Obtener todos los préstamos activos para calcular cuánto stock está "en la calle"
        const activeLoans = await Loan.find({ status: 'open' });
        
        let loan = await Loan.findOne({ client: clientId, status: 'open' }) || new Loan({ client: clientId, items: [] });

        for (let item of items) {
            const product = await Product.findById(item.productId);
            
            // 2. Calcular stock comprometido: total prestado - total devuelto en TODOS los préstamos
            let totalEnLaCalle = 0;
            activeLoans.forEach(l => {
                const itemEnPrestamo = l.items.find(i => i.product.toString() === item.productId);
                if (itemEnPrestamo) {
                    totalEnLaCalle += (itemEnPrestamo.qtyBorrowed - itemEnPrestamo.qtyReturned);
                }
            });

            // 3. Validación real: Stock Físico - Lo que ya deben = Disponible para prestar
            const disponible = product.stock - totalEnLaCalle;

            if (!product || disponible < item.qty) {
                return res.status(400).json({ 
                    success: false, 
                    message: `No puedes prestar ${item.qty} de ${product.name}. Solo hay ${disponible} disponibles.` 
                });
            }

            // 4. Si pasa la validación, registramos el préstamo (sin tocar el stock físico aún)
            const itemIndex = loan.items.findIndex(i => i.product.toString() === item.productId);
            if (itemIndex > -1) {
                loan.items[itemIndex].qtyBorrowed += item.qty;
            } else {
                loan.items.push({ product: item.productId, qtyBorrowed: item.qty, qtyReturned: 0 });
            }
        }
        await loan.save();
        res.json({ success: true, message: "Préstamo registrado. Stock reservado lógicamente." });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- DEVOLVER (Con validación: no puedes devolver más de lo prestado) ---
exports.returnLoanItem = async (req, res) => {
    try {
        const { loanId, productId, qty } = req.body;
        const loan = await Loan.findById(loanId);
        
        const item = loan.items.find(i => i.product.toString() === productId);
        if (!item) return res.status(404).json({ success: false, message: "Producto no encontrado en este préstamo." });

        // VALIDACIÓN: No puedes devolver más de lo que te prestaron
        const totalPendiente = item.qtyBorrowed - item.qtyReturned;
        if (qty > totalPendiente) {
            return res.status(400).json({ success: false, message: `No puedes devolver ${qty}. Solo debes ${totalPendiente}.` });
        }

        item.qtyReturned += qty;
        await loan.save();
        
        res.json({ success: true, message: "Devolución registrada correctamente." });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- OBTENER ACTIVO ---
exports.getActiveLoan = async (req, res) => {
    try {
        const loan = await Loan.findOne({ client: req.params.clientId, status: 'open' })
                               .populate('items.product', 'name');
        res.json({ success: true, data: loan });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllActiveLoansSummary = async (req, res) => {
    try {
        // Buscamos todos los préstamos abiertos
        const activeLoans = await Loan.find({ status: 'open' })
            .populate('client', 'name phone detalles') // Trae info del local
            .populate('items.product', 'name');        // Trae info de los productos

        res.json({ success: true, data: activeLoans });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- FINALIZAR (AQUÍ ES DONDE SE FACTURA Y SE DESCUENTA) ---
exports.finalizeLoanToBill = async (req, res) => {
    try {
        const { loanId } = req.params;
        // Obtenemos medioPago y pagaCon enviados desde Flutter
        const { medioPago, pagaCon } = req.body; 
        
        const loan = await Loan.findById(loanId).populate('client').populate('items.product');

        if (!loan || loan.status === 'closed') {
            return res.status(400).json({ success: false, message: "Préstamo no encontrado o ya cerrado." });
        }

        // 1. Obtener el siguiente consecutivo de factura
        const consecutivo = await getNextSequence('factura');

        // 2. Filtrar lo que el cliente NO devolvió y armar los productos de la factura
        let totalAmount = 0;
        const itemsToBill = loan.items
            .filter(i => i.qtyBorrowed > i.qtyReturned)
            .map(i => {
                const quantity = i.qtyBorrowed - i.qtyReturned;
                const price = i.product.price || 0;
                totalAmount += (price * quantity);

                return {
                    product: i.product._id,
                    quantity: quantity,
                    appliedPrice: price,
                    originalPrice: i.product.price
                };
            });

        if (itemsToBill.length === 0) {
            return res.status(400).json({ success: false, message: "No hay productos pendientes por facturar." });
        }

        // 3. Verificar primero que haya stock suficiente para TODOS antes de tocar nada
        for (let item of itemsToBill) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Stock insuficiente para el producto: ${product?.name || 'Desconocido'}` 
                });
            }
        }

        // 4. Construir la factura con todos los campos que exige tu NewBillSchema
        const bill = new NewBill({
            consecutivo,
            user: loan.client._id,
            userName: loan.client.name || 'Sin nombre',
            userPhone: loan.client.phone || 'Sin teléfono',
            userCC: loan.client.cc || 'N/A',
            userDetalles: loan.client.detalles || 'Sin detalles',
            products: itemsToBill,
            totalAmount: Number(totalAmount),
            medioPago: medioPago || 'Efectivo',
            pagaCon: Number(pagaCon) || Number(totalAmount),
            cambio: (Number(pagaCon) || Number(totalAmount)) - Number(totalAmount)
        });

        // 5. Guardar la factura PRIMERO. Si esto falla, el stock no se toca.
        await bill.save();

        // 6. Si la factura se guardó con éxito, ahora sí descontamos el stock físico
        for (let item of itemsToBill) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        // 7. Finalmente, cerramos el préstamo
        loan.status = 'closed';
        await loan.save();

        res.json({ success: true, message: "Factura generada y préstamo cerrado con éxito.", data: bill });
    } catch (err) { 
        console.error("Error detallado al finalizar préstamo:", err);
        res.status(500).json({ success: false, error: err.message }); 
    }
};
// --- OBTENER HISTORIAL DE PRÉSTAMOS CERRADOS / FACTURADOS ---
exports.getClosedLoansHistory = async (req, res) => {
    try {
        // Buscamos los préstamos con status 'closed' y traemos la información clave
        const closedLoans = await Loan.find({ status: 'closed' })
            .populate('client', 'name phone detalles')
            .populate('items.product', 'name price')
            .sort({ updatedAt: -1 }); // Los más recientes primero

        res.json({ success: true, data: closedLoans });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};