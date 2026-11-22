
const express = require("express");
const router = express.Router();
const { verificarToken, verificarRol } = require("../middleware/auth.middleware");

// Proteger todas las rutas administrativas
router.use(verificarToken, verificarRol("ADMIN"));

const {
    reporteCitas,
    reporteDermatologos,
    reporteServicios,
    reporteEspecialidades,
    reporteClientes
} = require("../controllers/reportes.controller");

// Reporte de citas
router.get("/citas", reporteCitas);

// Reporte de dermatólogos
router.get("/dermatologos", reporteDermatologos);

// Reporte de servicios
router.get("/servicios", reporteServicios);

// Reporte de especialidades
router.get("/especialidades", reporteEspecialidades);

// GET: Generar reporte PDF de clientes
router.get("/clientes", reporteClientes);

module.exports = router;
