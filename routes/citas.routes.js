
const express = require("express");
const router = express.Router();


console.log("1. Archivo citas.routes.js cargado");


// Importar las funciones del controlador de citas
const {
    registrarCita,
    consultarMisCitas,
    cancelarCita
} = require("../controllers/citas.controller");

// Importar el middleware de autenticación
const { verificarToken } = require("../middleware/auth.middleware");

// Registrar una nueva cita
router.post("/", verificarToken, registrarCita);

// Consultar las citas del cliente autenticado
router.get("/mis-citas", verificarToken, consultarMisCitas);

// Cancelar una cita del cliente autenticado
router.patch("/:id/cancelar", verificarToken, cancelarCita);

console.log("2. Ruta de cancelación registrada");

// Exportar las rutas
module.exports = router;
