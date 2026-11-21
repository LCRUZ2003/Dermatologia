
const express = require("express");
const router = express.Router();

const {
    registrarDermatologo,
    obtenerDermatologos,
    obtenerDermatologoPorId,
    actualizarDermatologo,
    eliminarDermatologo
} = require("../controllers/dermatologos.controller");

// POST: Registrar dermatólogo
router.post("/", registrarDermatologo);

// GET: Consultar todos los dermatólogos
router.get("/", obtenerDermatologos);

// GET: Consultar dermatólogo por ID
router.get("/:id", obtenerDermatologoPorId);

// PUT: Actualizar dermatólogo
router.put("/:id", actualizarDermatologo);

// DELETE: Eliminar dermatólogo
router.delete("/:id", eliminarDermatologo);

module.exports = router;

