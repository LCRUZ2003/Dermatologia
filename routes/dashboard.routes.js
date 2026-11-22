
const express = require("express");
const router = express.Router();
const { verificarToken, verificarRol } = require("../middleware/auth.middleware");

// Proteger todas las rutas administrativas
router.use(verificarToken, verificarRol("ADMIN"));

const {
    obtenerEstadisticas
} = require("../controllers/dashboard.controller");

// GET: Obtener estadísticas del dashboard
router.get("/estadisticas", obtenerEstadisticas);

module.exports = router;
