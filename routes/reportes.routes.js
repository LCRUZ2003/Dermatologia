
const express = require("express");
const router = express.Router();

const {
    reporteCitas,
    reporteDermatologos,
    reporteServicios,
    reporteEspecialidades
} = require("../controllers/reportes.controller");

// Reporte de citas
router.get("/citas", reporteCitas);

// Reporte de dermatólogos
router.get("/dermatologos", reporteDermatologos);

// Reporte de servicios
router.get("/servicios", reporteServicios);

// Reporte de especialidades
router.get("/especialidades", reporteEspecialidades);

module.exports = router;
