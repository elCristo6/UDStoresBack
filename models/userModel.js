const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
     
    },
    password: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false,
        trim: true
    },
    phone: {           
        type: String,
        required: false 
    },
    cc: {           
        type: String,
        required: false 
    },
    detalles: {           
        type: String,
        required: false 
    },
    role: {
        type: String,
        enum: ['admin', 'user'], // puedes agregar más roles si los necesitas
        default: 'user'
    }
},{
    timestamps: true 
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.pre('save', async function(next) {
    // Si la contraseña no ha sido proporcionada y hay un número de teléfono
    if (!this.password && this.phone) {
        // Utiliza los últimos cuatro dígitos del teléfono como contraseña
        const phoneLength = this.phone.length;
        this.password = this.phone.substring(phoneLength - 4, phoneLength);
    }

    // Si ahora hay una contraseña (proporcionada o generada), hashearla
    if (this.password) {
        const hash = await bcrypt.hash(this.password, saltRounds);
        this.password = hash;
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
