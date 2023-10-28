const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Otros campos según tus necesidades
},{
    timestamps: true
});
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const hash = await bcrypt.hash(this.password, saltRounds);
        this.password = hash;
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
