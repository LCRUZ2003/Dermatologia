
const express = require("express");
const router = express.Router();

console.log("1. Archivo citas.routes.js cargado");

// Importar las funciones del controlador
const {
    registrarCita,
    obtenerDisponibilidad,
    consultarMisCitas,
    cancelarCita
} = require("../controllers/citas.controller");

// Importar middleware de autenticación
const { verificarToken } = require("../middleware/auth.middleware");

// Consultar horas disponibles
router.get("/disponibilidad", verificarToken, obtenerDisponibilidad);

// Registrar una nueva cita
router.post("/", verificarToken, registrarCita);

// Consultar las citas del cliente autenticado
router.get("/miscitas", verificarToken, consultarMisCitas);

// Cancelar una cita
router.patch("/:id/cancelar", verificarToken, cancelarCita);

console.log("2. Rutas de citas registradas");

module.exports = router;
