
const pool = require("../config/db"); 

// ========================================
// REGISTRAR UN HORARIO
// ========================================
const registrarHorario = async (req, res) => {
    const {
        id_dermatologo,
        dia_semana,
        hora_inicio,
        hora_fin
    } = req.body;

    if (!id_dermatologo || !dia_semana || !hora_inicio || !hora_fin) {
        return res.status(400).json({
            mensaje: "Completa todos los campos obligatorios."
        });
    }

    try {
        // Comprobar que el dermatólogo exista
        const dermatologo = await pool.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1`,
            [id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El dermatólogo seleccionado no existe."
            });
        }

        // Comprobar que no exista un horario superpuesto
        const conflicto = await pool.query(
            `SELECT id_horario
             FROM horarios
             WHERE id_dermatologo = $1
             AND dia_semana = $2
             AND estado = TRUE
             AND hora_inicio < $4
             AND hora_fin > $3`,
            [id_dermatologo, dia_semana, hora_inicio, hora_fin]
        );

        if (conflicto.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El dermatólogo ya tiene un horario registrado en ese intervalo."
            });
        }

        const resultado = await pool.query(
            `INSERT INTO horarios
            (id_dermatologo, dia_semana, hora_inicio, hora_fin)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [id_dermatologo, dia_semana, hora_inicio, hora_fin]
        );

        res.status(201).json({
            mensaje: "Horario registrado correctamente.",
            horario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar horario:", error.message);

        if (error.code === "23503") {
            return res.status(400).json({
                mensaje: "El dermatólogo seleccionado no existe."
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                mensaje: "El día o las horas proporcionadas no son válidos."
            });
        }

        res.status(500).json({
            mensaje: "Error al registrar el horario."
        });
    }
};


// ========================================
// CONSULTAR TODOS LOS HORARIOS
// ========================================
const obtenerHorarios = async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                h.*,
                d.nombres,
                d.apellidos
            FROM horarios h
            INNER JOIN dermatologos d
                ON h.id_dermatologo = d.id_dermatologo
            ORDER BY h.id_dermatologo, h.dia_semana, h.hora_inicio
        `);

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar horarios:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar los horarios."
        });
    }
};


// ========================================
// CONSULTAR HORARIOS POR DERMATÓLOGO
// ========================================
const obtenerHorariosPorDermatologo = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(`
            SELECT
                h.*,
                d.nombres,
                d.apellidos
            FROM horarios h
            INNER JOIN dermatologos d
                ON h.id_dermatologo = d.id_dermatologo
            WHERE h.id_dermatologo = $1
            ORDER BY h.dia_semana, h.hora_inicio
        `, [id]);

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar horarios:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar los horarios del dermatólogo."
        });
    }
};


// ========================================
// ACTUALIZAR UN HORARIO
// ========================================
const actualizarHorario = async (req, res) => {
    const { id } = req.params;

    const {
        id_dermatologo,
        dia_semana,
        hora_inicio,
        hora_fin
    } = req.body;

    if (!id_dermatologo || !dia_semana || !hora_inicio || !hora_fin) {
        return res.status(400).json({
            mensaje: "Completa todos los campos obligatorios."
        });
    }

    try {
        // Comprobar que no exista un horario superpuesto
        const conflicto = await pool.query(
            `SELECT id_horario
             FROM horarios
             WHERE id_dermatologo = $1
             AND dia_semana = $2
             AND estado = TRUE
             AND id_horario <> $5
             AND hora_inicio < $4
             AND hora_fin > $3`,
            [id_dermatologo, dia_semana, hora_inicio, hora_fin, id]
        );

        if (conflicto.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El dermatólogo ya tiene otro horario en ese intervalo."
            });
        }

        const resultado = await pool.query(
            `UPDATE horarios
             SET id_dermatologo = $1,
                 dia_semana = $2,
                 hora_inicio = $3,
                 hora_fin = $4
             WHERE id_horario = $5
             RETURNING *`,
            [id_dermatologo, dia_semana, hora_inicio, hora_fin, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Horario no encontrado."
            });
        }

        res.json({
            mensaje: "Horario actualizado correctamente.",
            horario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar horario:", error.message);

        if (error.code === "23503") {
            return res.status(400).json({
                mensaje: "El dermatólogo seleccionado no existe."
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                mensaje: "El día o las horas proporcionadas no son válidos."
            });
        }

        res.status(500).json({
            mensaje: "Error al actualizar el horario."
        });
    }
};


// ========================================
// DESACTIVAR UN HORARIO
// ========================================
const desactivarHorario = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `UPDATE horarios
             SET estado = FALSE
             WHERE id_horario = $1
             RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Horario no encontrado."
            });
        }

        res.json({
            mensaje: "Horario desactivado correctamente.",
            horario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al desactivar horario:", error.message);

        res.status(500).json({
            mensaje: "Error al desactivar el horario."
        });
    }
};


module.exports = {
    registrarHorario,
    obtenerHorarios,
    obtenerHorariosPorDermatologo,
    actualizarHorario,
    desactivarHorario
};
