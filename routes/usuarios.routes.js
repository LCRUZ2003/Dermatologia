// Importar Express
const express = require("express");

// Crear el enrutador
const router = express.Router();

// Importar el controlador de usuarios
const {
    registrarUsuario,
    iniciarSesion
} = require("../controllers/usuarios.controller");
// Importar el middleware de autenticación

const { verificarToken,verificarRol } = require("../middleware/auth.middleware");

// Ruta para registrar clientes
router.post("/registro", registrarUsuario);

// Ruta para iniciar sesión
router.post("/login", iniciarSesion);

// Consultar el perfil del usuario autenticado
router.get("/perfil", verificarToken, (req, res) => {
    res.json({
        mensaje: "Acceso autorizado.",
        usuario: req.usuario
    });
});

// Ruta de prueba exclusiva para administradores
router.get("/admin", verificarToken, verificarRol("ADMIN"), (req, res) => {
    res.json({
        mensaje: "Acceso autorizado. Bienvenido al área administrativa.",
        usuario: req.usuario
    });
});

// Exportar las rutas
module.exports = router;