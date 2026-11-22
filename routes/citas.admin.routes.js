
const express = require("express"); 
const router = express.Router();
// Importar los middleware de autenticación
const { verificarToken, verificarRol } = require("../middleware/auth.middleware");

const {
    obtenerCitas,
    obtenerCitaPorId,
    obtenerCitasPorFecha,
    obtenerCitasPorDermatologo,
    confirmarCita,
    actualizarCita,
    obtenerCitasPendientes,
    obtenerCitasPorCliente
} = require("../controllers/citas.admin.controller");

// Proteger todas las rutas administrativas
router.use(verificarToken, verificarRol("ADMIN"));
// GET: Consultar todas las citas
router.get("/", obtenerCitas);

// GET: Consultar citas pendientes
router.get("/pendientes", obtenerCitasPendientes);

// GET: Filtrar citas por fecha
router.get("/fecha/:fecha", obtenerCitasPorFecha);

// GET: Filtrar citas por dermatólogo
router.get("/dermatologo/:id", obtenerCitasPorDermatologo);

// GET: Consultar citas por cliente
router.get("/cliente/:id", obtenerCitasPorCliente);

// PATCH: Confirmar una cita
router.patch("/:id/confirmar", confirmarCita);

// PUT: Modificar una cita
router.put("/:id", actualizarCita);

// GET: Consultar una cita por ID
router.get("/:id", obtenerCitaPorId);

module.exports = router;
