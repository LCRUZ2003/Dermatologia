
const express = require("express");
const router = express.Router();

const {
    registrarEspecialidad,
    obtenerEspecialidades,
    obtenerEspecialidadPorId,
    actualizarEspecialidad,
    desactivarEspecialidad,
    cambiarEstadoEspecialidad
} = require("../controllers/especialidades.controller");

// Registrar especialidad
router.post("/", registrarEspecialidad);

// Consultar todas las especialidades
router.get("/", obtenerEspecialidades);

// Consultar una especialidad
router.get("/:id", obtenerEspecialidadPorId);

// Actualizar especialidad
router.put("/:id", actualizarEspecialidad);

// Desactivar especialidad
router.delete("/:id", desactivarEspecialidad);

// Activar o desactivar especialidad
router.patch("/:id/estado", cambiarEstadoEspecialidad);

module.exports = router;
