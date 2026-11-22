
const express = require("express"); 
const router = express.Router();

const {
    obtenerCitas,
    obtenerCitaPorId,
    obtenerCitasPorFecha,
    obtenerCitasPorDermatologo,
    confirmarCita,
    actualizarCita,
    obtenerCitasPendientes
} = require("../controllers/citas.admin.controller");

// GET: Consultar todas las citas
router.get("/", obtenerCitas);

// GET: Consultar citas pendientes
router.get("/pendientes", obtenerCitasPendientes);

// GET: Filtrar citas por fecha
router.get("/fecha/:fecha", obtenerCitasPorFecha);

// GET: Filtrar citas por dermatólogo
router.get("/dermatologo/:id", obtenerCitasPorDermatologo);

// PATCH: Confirmar una cita
router.patch("/:id/confirmar", confirmarCita);

// PUT: Modificar una cita
router.put("/:id", actualizarCita);

// GET: Consultar una cita por ID
router.get("/:id", obtenerCitaPorId);

module.exports = router;
