const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'clave-super-secreta'; // usa dotenv si quieres

// Verifica que el token sea válido y decodifica
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).send('Token no proporcionado');

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Guarda la data del token (userId, role, etc.)
        next();
    } catch (err) {
        return res.status(403).send('Token inválido o expirado');
    }
};

// Verifica si el usuario tiene el rol requerido
exports.requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).send('Acceso denegado. Rol insuficiente');
        }
        next();
    };
};