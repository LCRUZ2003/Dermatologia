
const express = require("express");
const router = express.Router();

const {
    registrarDermatologo,
    obtenerDermatologos,
    obtenerDermatologoPorId,
    actualizarDermatologo,
    cambiarEstadoDermatologo
} = require("../controllers/dermatologos.controller");

router.post("/", registrarDermatologo);
router.get("/", obtenerDermatologos);
router.get("/:id", obtenerDermatologoPorId);
router.put("/:id", actualizarDermatologo);
router.patch("/:id/estado", cambiarEstadoDermatologo);

module.exports = router;