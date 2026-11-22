
const pool = require("../config/db");

// ========================================
// REGISTRAR UN SERVICIO
// ========================================
const registrarServicio = async (req, res) => {
    const {
        nombre,
        descripcion,
        precio,
        duracion_minutos
    } = req.body;

    if (!nombre || !nombre.trim() || precio === undefined || !duracion_minutos) {
        return res.status(400).json({
            mensaje: "Completa los campos obligatorios."
        });
    }

    if (
        !Number.isFinite(Number(precio)) ||
        Number(precio) < 0 ||
        !Number.isInteger(Number(duracion_minutos)) ||
        Number(duracion_minutos) <= 0
    ) {
        return res.status(400).json({
            mensaje: "El precio debe ser mayor o igual a cero y la duración debe ser un número entero positivo."
        });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO servicios
            (nombre, descripcion, precio, duracion_minutos)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                nombre.trim(),
                descripcion || null,
                precio,
                duracion_minutos
            ]
        );

        res.status(201).json({
            mensaje: "Servicio registrado correctamente.",
            servicio: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar servicio:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "Este servicio ya está registrado."
            });
        }

        res.status(500).json({
            mensaje: "Error al registrar el servicio."
        });
    }
};


// ========================================
// CONSULTAR TODOS LOS SERVICIOS
// ========================================
const obtenerServicios = async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT * FROM servicios
             ORDER BY id_servicio ASC`
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar servicios:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar los servicios."
        });
    }
};


// ========================================
// CONSULTAR UN SERVICIO POR ID
// ========================================
const obtenerServicioPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `SELECT * FROM servicios
             WHERE id_servicio = $1`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Servicio no encontrado."
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al consultar servicio:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar el servicio."
        });
    }
};


// ========================================
// ACTUALIZAR UN SERVICIO
// ========================================
const actualizarServicio = async (req, res) => {
    const { id } = req.params;

    const {
        nombre,
        descripcion,
        precio,
        duracion_minutos
    } = req.body;

    if (!nombre || !nombre.trim() || precio === undefined || !duracion_minutos) {
        return res.status(400).json({
            mensaje: "Completa los campos obligatorios."
        });
    }

    if (
        !Number.isFinite(Number(precio)) ||
        Number(precio) < 0 ||
        !Number.isInteger(Number(duracion_minutos)) ||
        Number(duracion_minutos) <= 0
    ) {
        return res.status(400).json({
            mensaje: "El precio debe ser mayor o igual a cero y la duración debe ser un número entero positivo."
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE servicios
             SET nombre = $1,
                 descripcion = $2,
                 precio = $3,
                 duracion_minutos = $4
             WHERE id_servicio = $5
             RETURNING *`,
            [
                nombre.trim(),
                descripcion || null,
                precio,
                duracion_minutos,
                id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Servicio no encontrado."
            });
        }

        res.json({
            mensaje: "Servicio actualizado correctamente.",
            servicio: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar servicio:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "Ya existe un servicio con ese nombre."
            });
        }

        res.status(500).json({
            mensaje: "Error al actualizar el servicio."
        });
    }
};


// ========================================
// DESACTIVAR UN SERVICIO
// ========================================
const desactivarServicio = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `UPDATE servicios
             SET estado = FALSE
             WHERE id_servicio = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Servicio no encontrado."
            });
        }

        res.json({
            mensaje: "Servicio desactivado correctamente.",
            servicio: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al desactivar servicio:", error.message);

        res.status(500).json({
            mensaje: "Error al desactivar el servicio."
        });
    }
};


module.exports = {
    registrarServicio,
    obtenerServicios,
    obtenerServicioPorId,
    actualizarServicio,
    desactivarServicio
};
