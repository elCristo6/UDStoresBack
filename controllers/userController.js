const User = require('../models/userModel');


exports.register = async (req, res) => {
    try {
        // Verificar si el email o el teléfono ya están registrados
        const existingUserByEmail = await User.findOne({ email: req.body.email });
        if (existingUserByEmail) {
            return res.status(409).send('El correo electrónico ya está registrado.');
        }

        const existingUserByPhone = await User.findOne({ phone: req.body.phone });
        if (existingUserByPhone) {
            return res.status(409).send('El número de teléfono ya está registrado.');
        }

        // Crear y guardar el nuevo usuario
        const newUser = new User({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            phone: req.body.phone,
            cc: req.body.cc,
            detalles: req.body.detalles,
            role: req.body.role || 'user' 
            // Otros campos, si los hay
        });
        await newUser.save();
        res.status(201).send('Usuario registrado con éxito.');
    } catch (err) {
        console.error(err); // Imprime el error completo en la consola del servidor
        return res.status(500).send(err.message); // Envía un mensaje de error más detallado
    }
};

const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'clave-super-secreta';


exports.authenticate = async (req, res) => {
    try {
        const identifier = req.body.emailOrPhone;
        const password = req.body.password;

        // Validar si el identificador es email o teléfono
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const query = emailRegex.test(identifier)
            ? { email: identifier }
            : { phone: identifier };

        // Buscar usuario por email o teléfono
        const user = await User.findOne(query);
        if (!user) return res.status(404).send('Usuario no encontrado.');

        // Comparar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).send('Contraseña incorrecta.');

        // Generar token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            secretKey,
            { expiresIn: '12h' }
        );

        // Responder con éxito
        res.send({
            message: 'Usuario autenticado con éxito.',
            token,
            name: user.name,
            role: user.role
        });

    } catch (err) {
        console.error('Error en autenticación:', err);
        res.status(500).send(err.message);
    }
};
exports.findByPhone = async (req, res) => {
    try {
        const phone = req.params.phone;
        const user = await User.findOne({ phone: phone });

        if (!user) {
            return res.status(404).send({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).send({ error: 'Error al buscar el usuario.' });
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
exports.findById = async (req, res) => {
    try {
      const id = req.params.id;
  
      if (!id || id.length !== 24) {
        return res.status(400).json({ error: 'ID inválido' });
      }
  
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      res.status(200).json(user);
    } catch (err) {
      console.error('Error al buscar usuario por ID:', err);
      res.status(500).json({ error: 'Error interno al buscar usuario por ID' });
    }
  };


