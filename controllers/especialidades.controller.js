
const pool = require("../config/db");

// ========================================
// REGISTRAR UNA ESPECIALIDAD
// ========================================
const registrarEspecialidad = async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({
            mensaje: "El nombre de la especialidad es obligatorio."
        });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO especialidades (nombre, descripcion)
             VALUES ($1, $2)
             RETURNING *`,
            [nombre.trim(), descripcion || null]
        );

        res.status(201).json({
            mensaje: "Especialidad registrada correctamente.",
            especialidad: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar especialidad:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "Esta especialidad ya está registrada."
            });
        }

        res.status(500).json({
            mensaje: "Error al registrar la especialidad."
        });
    }
};


// ========================================
// CONSULTAR TODAS LAS ESPECIALIDADES
// ========================================
const obtenerEspecialidades = async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT * FROM especialidades
             ORDER BY id_especialidad ASC`
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar especialidades:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar las especialidades."
        });
    }
};


// ========================================
// CONSULTAR UNA ESPECIALIDAD POR ID
// ========================================
const obtenerEspecialidadPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `SELECT * FROM especialidades
             WHERE id_especialidad = $1`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Especialidad no encontrada."
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al consultar especialidad:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar la especialidad."
        });
    }
};


// ========================================
// ACTUALIZAR UNA ESPECIALIDAD
// ========================================
const actualizarEspecialidad = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({
            mensaje: "El nombre de la especialidad es obligatorio."
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE especialidades
             SET nombre = $1,
                 descripcion = $2
             WHERE id_especialidad = $3
             RETURNING *`,
            [nombre.trim(), descripcion || null, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Especialidad no encontrada."
            });
        }

        res.json({
            mensaje: "Especialidad actualizada correctamente.",
            especialidad: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar especialidad:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "Ya existe una especialidad con ese nombre."
            });
        }

        res.status(500).json({
            mensaje: "Error al actualizar la especialidad."
        });
    }
};


// ========================================
// DESACTIVAR UNA ESPECIALIDAD
// ========================================
const desactivarEspecialidad = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `UPDATE especialidades
             SET estado = FALSE
             WHERE id_especialidad = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Especialidad no encontrada."
            });
        }

        res.json({
            mensaje: "Especialidad desactivada correctamente.",
            especialidad: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al desactivar especialidad:", error.message);

        res.status(500).json({
            mensaje: "Error al desactivar la especialidad."
        });
    }
};

// ========================================
// ACTIVAR O DESACTIVAR UNA ESPECIALIDAD
// ========================================
const cambiarEstadoEspecialidad = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `UPDATE especialidades
             SET estado = NOT estado
             WHERE id_especialidad = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Especialidad no encontrada."
            });
        }

        res.json({
            mensaje: resultado.rows[0].estado
                ? "Especialidad activada correctamente."
                : "Especialidad desactivada correctamente.",
            especialidad: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al cambiar estado:", error.message);

        res.status(500).json({
            mensaje: "Error al cambiar el estado de la especialidad."
        });
    }
};

module.exports = {
    registrarEspecialidad,
    obtenerEspecialidades,
    obtenerEspecialidadPorId,
    actualizarEspecialidad,
    desactivarEspecialidad,
    cambiarEstadoEspecialidad
};
