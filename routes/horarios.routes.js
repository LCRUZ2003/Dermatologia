
const express = require("express");
const router = express.Router();

const {
    registrarHorario,
    obtenerHorarios,
    obtenerHorariosPorDermatologo,
    actualizarHorario,
    desactivarHorario,
    cambiarEstadoHorario
} = require("../controllers/horarios.controller");

// POST: Registrar horario
router.post("/", registrarHorario);

// GET: Consultar todos los horarios
router.get("/", obtenerHorarios);

// GET: Consultar horarios de un dermatólogo
router.get("/dermatologo/:id", obtenerHorariosPorDermatologo);

// PUT: Actualizar horario
router.put("/:id", actualizarHorario);

// DELETE: Desactivar horario
router.delete("/:id", desactivarHorario);

router.patch("/:id/estado", cambiarEstadoHorario);

module.exports = router;
