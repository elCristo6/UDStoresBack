const mongoose = require('mongoose');
const moment = require('moment-timezone');

const LoanItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qtyBorrowed: { type: Number, required: true },
    qtyReturned: { type: Number, default: 0 },
    customPrice: { type: Number, default: null }, // <--- NUEVO CAMPO: Si es null, usa el original
    createdAt: {
        type: Date,
        default: () => moment().tz('America/Bogota').toDate()
    }
});

const LoanSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [LoanItemSchema],
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);