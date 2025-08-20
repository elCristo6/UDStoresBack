const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', userController.register);
// Ruta para autenticar un usuario
router.post('/login', userController.authenticate);  // He usado /login aquí, pero puedes usar /authenticate o cualquier otra ruta que prefieras.
router.get('/', verifyToken, requireRole('admin'), userController.getAllUsers);
router.delete('/:email', verifyToken, requireRole('admin'), userController.deleteByEmail);
router.get('/', userController.getAllUsers);
//router.delete('/:email', userController.deleteByEmail);
router.get('/phone/:phone', userController.findByPhone);
router.get('/id/:id', userController.findById); // Nuevo endpoint por ID

module.exports = router;
