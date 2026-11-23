
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
            mensaje: "Completa todos los campos del horario."
        });
    }

    const diasPermitidos = [
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
        "Domingo"
    ];

    if (!diasPermitidos.includes(dia_semana)) {
        return res.status(400).json({
            mensaje: "El día de la semana no es válido."
        });
    }

    if (hora_fin <= hora_inicio) {
        return res.status(400).json({
            mensaje: "La hora de finalización debe ser posterior a la hora de inicio."
        });
    }

    try {
        // Verificar que el dermatólogo exista
        const dermatologo = await pool.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1`,
            [id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El dermatólogo no existe."
            });
        }

        // Verificar que no exista otro horario que se cruce
        const conflicto = await pool.query(`
            SELECT id_horario
            FROM horarios
            WHERE id_dermatologo = $1
            AND dia_semana = $2
            AND estado = TRUE
            AND hora_inicio < $4::TIME
            AND hora_fin > $3::TIME
        `, [
            id_dermatologo,
            dia_semana,
            hora_inicio,
            hora_fin
        ]);

        if (conflicto.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El horario se cruza con otro horario registrado."
            });
        }

        const resultado = await pool.query(`
            INSERT INTO horarios (
                id_dermatologo,
                dia_semana,
                hora_inicio,
                hora_fin
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [
            id_dermatologo,
            dia_semana,
            hora_inicio,
            hora_fin
        ]);

        res.status(201).json({
            mensaje: "Horario registrado correctamente.",
            horario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar horario:", error.message);

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
            ORDER BY
                d.nombres,
                d.apellidos,
                h.dia_semana,
                h.hora_inicio
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
            AND h.estado = TRUE
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
            mensaje: "Completa todos los campos del horario."
        });
    }

    const diasPermitidos = [
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
        "Domingo"
    ];

    if (!diasPermitidos.includes(dia_semana)) {
        return res.status(400).json({
            mensaje: "El día de la semana no es válido."
        });
    }

    if (hora_fin <= hora_inicio) {
        return res.status(400).json({
            mensaje: "La hora de finalización debe ser posterior a la hora de inicio."
        });
    }

    try {
        // Verificar que el horario exista
        const horario = await pool.query(
            `SELECT id_horario
             FROM horarios
             WHERE id_horario = $1`,
            [id]
        );

        if (horario.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El horario no existe."
            });
        }

        // Verificar que el dermatólogo exista
        const dermatologo = await pool.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1`,
            [id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El dermatólogo no existe."
            });
        }

        // Verificar que no se cruce con otro horario
        const conflicto = await pool.query(`
            SELECT id_horario
            FROM horarios
            WHERE id_dermatologo = $1
            AND dia_semana = $2
            AND estado = TRUE
            AND id_horario <> $5
            AND hora_inicio < $4::TIME
            AND hora_fin > $3::TIME
        `, [
            id_dermatologo,
            dia_semana,
            hora_inicio,
            hora_fin,
            id
        ]);

        if (conflicto.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El horario se cruza con otro horario registrado."
            });
        }

        const resultado = await pool.query(`
            UPDATE horarios
            SET
                id_dermatologo = $1,
                dia_semana = $2,
                hora_inicio = $3,
                hora_fin = $4
            WHERE id_horario = $5
            RETURNING *
        `, [
            id_dermatologo,
            dia_semana,
            hora_inicio,
            hora_fin,
            id
        ]);

        res.json({
            mensaje: "Horario actualizado correctamente.",
            horario: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar horario:", error.message);

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
        const resultado = await pool.query(`
            UPDATE horarios
            SET estado = FALSE
            WHERE id_horario = $1
            AND estado = TRUE
            RETURNING *
        `, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El horario no existe o ya está desactivado."
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


// ========================================
// EXPORTAR FUNCIONES
// ========================================
module.exports = {
    registrarHorario,
    obtenerHorarios,
    obtenerHorariosPorDermatologo,
    actualizarHorario,
    desactivarHorario
};
