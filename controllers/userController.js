const User = require('../models/userModel');

exports.register = async (req, res) => {
    try {
        const newUser = new User({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name
            // Otros campos
        });
        await newUser.save();
        res.status(201).send('Usuario registrado con éxito.');
    } catch (err) {
        if (err.code && err.code === 11000) {
            return res.status(409).send('El correo electrónico ya está registrado.');
        }
        return res.status(500).send(err);
    }
};

exports.authenticate = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).send('Usuario no encontrado.');
        }

        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(401).send('Contraseña incorrecta.');
        }

        res.send({
            message: 'Usuario autenticado con éxito.',
            name: user.name
        });
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).send({ error: 'Error al obtener los usuarios.' });
    }
};

exports.deleteByEmail = async (req, res) => {
    try {
        const email = req.params.email;
        const result = await User.findOneAndDelete({ email: email });

        if (!result) {
            return res.status(404).send({ error: 'Usuario no encontrado.' });
        }
        
        res.status(200).send({ message: 'Usuario eliminado con éxito.' });
    } catch (err) {
        res.status(500).send({ error: 'Error al eliminar el usuario.' });
    }
};