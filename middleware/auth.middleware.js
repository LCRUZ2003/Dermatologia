// Importar JWT
const jwt = require("jsonwebtoken");

// Verificar el token de autenticación
const verificarToken = (req, res, next) => {
    try {
        // Obtener el token del encabezado
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                mensaje: "Debes iniciar sesión para acceder."
            });
        }

        // Extraer el token
        const token = authHeader.split(" ")[1];

        // Verificar el token
        const datosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guardar los datos del usuario en la solicitud
        req.usuario = datosUsuario;

        // Continuar con la siguiente función
        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: "Token inválido o expirado."
        });
    }
};

// Verificar los permisos según el rol del usuario
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {

        // Comprobar si el rol del usuario está permitido
        if (!rolesPermitidos.includes(req.usuario.codigo_rol)) {
            return res.status(403).json({
                mensaje: "No tienes permisos para realizar esta acción."
            });
        }

        // Permitir continuar
        next();
    };
};


module.exports = { verificarToken, verificarRol };