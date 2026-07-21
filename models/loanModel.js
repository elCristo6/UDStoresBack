//models/loanModel.js

const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    // Referencia al usuario (el local identificado como 'store')
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Lista de productos prestados
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        qtyBorrowed: { type: Number, required: true },
        qtyReturned: { type: Number, default: 0 }
    }],
    
    // Para saber si el local debe algo o ya entregó todo
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);