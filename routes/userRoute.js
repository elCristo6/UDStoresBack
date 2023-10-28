const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', userController.register);
// Ruta para autenticar un usuario
router.post('/login', userController.authenticate);  // He usado /login aquí, pero puedes usar /authenticate o cualquier otra ruta que prefieras.
router.get('/', userController.getAllUsers);
router.delete('/:email', userController.deleteByEmail);
module.exports = router;
