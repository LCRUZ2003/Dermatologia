
const express = require("express");
const router = express.Router();

const {
    registrarEspecialidad,
    obtenerEspecialidades,
    obtenerEspecialidadPorId,
    actualizarEspecialidad,
    desactivarEspecialidad
} = require("../controllers/especialidades.controller");

// POST: Registrar especialidad
router.post("/", registrarEspecialidad);

// GET: Consultar todas
router.get("/", obtenerEspecialidades);

// GET: Consultar por ID
router.get("/:id", obtenerEspecialidadPorId);

// PUT: Actualizar especialidad
router.put("/:id", actualizarEspecialidad);

// DELETE: Desactivar especialidad
router.delete("/:id", desactivarEspecialidad);

module.exports = router;
