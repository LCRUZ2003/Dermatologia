
const express = require("express");
const router = express.Router();

const {
    registrarServicio,
    obtenerServicios,
    obtenerServicioPorId,
    actualizarServicio,
    desactivarServicio
} = require("../controllers/servicios.controller");

// POST: Registrar servicio
router.post("/", registrarServicio);

// GET: Consultar todos los servicios
router.get("/", obtenerServicios);

// GET: Consultar servicio por ID
router.get("/:id", obtenerServicioPorId);

// PUT: Actualizar servicio
router.put("/:id", actualizarServicio);

// DELETE: Desactivar servicio
router.delete("/:id", desactivarServicio);

module.exports = router;
