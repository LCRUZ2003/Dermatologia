
const pool = require("../config/db");

// Consulta base para mostrar la información de las citas
const consultaCitas = `
    SELECT
        c.*,
        d.nombres AS nombre_dermatologo,
        d.apellidos AS apellido_dermatologo,
        s.nombre AS nombre_servicio,
        s.precio AS precio_servicio,
        s.duracion_minutos
    FROM citas c
    INNER JOIN dermatologos d
        ON c.id_dermatologo = d.id_dermatologo
    INNER JOIN servicios s
        ON c.id_servicio = s.id_servicio
`;

// ========================================
// CONSULTAR TODAS LAS CITAS
// ========================================
const obtenerCitas = async (req, res) => {
    try {
        const resultado = await pool.query(
            `${consultaCitas}
             ORDER BY c.fecha_cita DESC, c.hora_cita DESC`
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar citas:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar las citas."
        });
    }
};


// ========================================
// CONSULTAR UNA CITA POR ID
// ========================================
const obtenerCitaPorId = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: "El ID de la cita no es válido."
        });
    }

    try {
        const resultado = await pool.query(
            `${consultaCitas}
             WHERE c.id_cita = $1`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Cita no encontrada."
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al consultar cita:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar la cita."
        });
    }
};


// ========================================
// FILTRAR CITAS POR FECHA
// ========================================
const obtenerCitasPorFecha = async (req, res) => {
    const { fecha } = req.params;

    try {
        const resultado = await pool.query(
            `${consultaCitas}
             WHERE c.fecha_cita = $1
             ORDER BY c.hora_cita ASC`,
            [fecha]
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al filtrar citas por fecha:", error.message);

        res.status(400).json({
            mensaje: "La fecha proporcionada no es válida."
        });
    }
};


// ========================================
// FILTRAR CITAS POR DERMATÓLOGO
// ========================================
const obtenerCitasPorDermatologo = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: "El ID del dermatólogo no es válido."
        });
    }

    try {
        const resultado = await pool.query(
            `${consultaCitas}
             WHERE c.id_dermatologo = $1
             ORDER BY c.fecha_cita DESC, c.hora_cita ASC`,
            [id]
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al filtrar citas:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar las citas del dermatólogo."
        });
    }
};


// ========================================
// CONFIRMAR UNA CITA
// ========================================

const confirmarCita = async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: "El ID de la cita no es válido."
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Obtener información de la cita
        const resultadoCita = await client.query(
            `SELECT
                c.id_cita,
                c.id_dermatologo,
                c.id_servicio,
                TO_CHAR(c.fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
                TO_CHAR(c.hora_cita, 'HH24:MI') AS hora_cita,
                c.estado_cita,
                s.duracion_minutos
             FROM citas c
             INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
             WHERE c.id_cita = $1
             FOR UPDATE OF c`,
            [id]
        );

        if (resultadoCita.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                mensaje: "Cita no encontrada."
            });
        }

        const cita = resultadoCita.rows[0];

        if (cita.estado_cita !== "PENDIENTE") {
            await client.query("ROLLBACK");
            return res.status(409).json({
                mensaje: "Solo se pueden confirmar citas pendientes."
            });
        }

        // Bloquear modificaciones simultáneas del mismo horario
        await client.query(
            `SELECT pg_advisory_xact_lock(
                hashtext($1),
                hashtext($2)
            )`,
            [String(cita.id_dermatologo), cita.fecha_cita]
        );

        // Comprobar dermatólogo activo
        const dermatologo = await client.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1
             AND estado = TRUE`,
            [cita.id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                mensaje: "El dermatólogo está inactivo."
            });
        }

        // Comprobar servicio activo
        const servicio = await client.query(
            `SELECT id_servicio
             FROM servicios
             WHERE id_servicio = $1
             AND estado = TRUE`,
            [cita.id_servicio]
        );

        if (servicio.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                mensaje: "El servicio está inactivo."
            });
        }

        // Obtener el día de la semana
        const fecha = new Date(`${cita.fecha_cita}T00:00:00Z`);

        const dias = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miercoles",
            "Jueves",
            "Viernes",
            "Sabado"
        ];

        const diaSemana = dias[fecha.getUTCDay()];

        // Comprobar disponibilidad
        const horario = await client.query(
            `SELECT id_horario
             FROM horarios
             WHERE id_dermatologo = $1
             AND dia_semana = $2
             AND estado = TRUE
             AND $3::time >= hora_inicio
             AND $3::time +
                 ($4 * INTERVAL '1 minute') <= hora_fin
             LIMIT 1`,
            [
                cita.id_dermatologo,
                diaSemana,
                cita.hora_cita,
                cita.duracion_minutos
            ]
        );

        if (horario.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                mensaje: "La cita está fuera del horario disponible del dermatólogo."
            });
        }

        // Comprobar cruces con otras citas
        const conflicto = await client.query(
            `SELECT c.id_cita
             FROM citas c
             INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
             WHERE c.id_dermatologo = $1
             AND c.fecha_cita = $2
             AND c.id_cita <> $3
             AND c.estado_cita IN ('PENDIENTE', 'CONFIRMADA')
             AND c.hora_cita <
                 ($4::time + ($5 * INTERVAL '1 minute'))
             AND (
                 c.hora_cita +
                 (s.duracion_minutos * INTERVAL '1 minute')
             ) > $4::time
             LIMIT 1`,
            [
                cita.id_dermatologo,
                cita.fecha_cita,
                id,
                cita.hora_cita,
                cita.duracion_minutos
            ]
        );

        if (conflicto.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                mensaje: "Existe otra cita que ocupa ese horario."
            });
        }

        // Confirmar cita
        const actualizacion = await client.query(
            `UPDATE citas
             SET estado_cita = 'CONFIRMADA'
             WHERE id_cita = $1
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            mensaje: "Cita confirmada correctamente.",
            cita: actualizacion.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error al confirmar cita:", error.message);

        res.status(500).json({
            mensaje: "Error al confirmar la cita."
        });

    } finally {
        client.release();
    }
};

// ========================================
// MODIFICAR UNA CITA
// ========================================

const actualizarCita = async (req, res) => {
    const { id } = req.params;

    const {
        id_dermatologo,
        id_servicio,
        fecha_cita,
        hora_cita,
        motivo_consulta
    } = req.body;

    if (
        !Number.isInteger(Number(id)) || Number(id) <= 0 ||
        !Number.isInteger(Number(id_dermatologo)) || Number(id_dermatologo) <= 0 ||
        !Number.isInteger(Number(id_servicio)) || Number(id_servicio) <= 0 ||
        !fecha_cita || !hora_cita
    ) {
        return res.status(400).json({
            mensaje: "Verifica los datos obligatorios de la cita."
        });
    }

    // Validar fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_cita)) {
        return res.status(400).json({
            mensaje: "La fecha debe tener el formato YYYY-MM-DD."
        });
    }

    const fechaValidada = new Date(`${fecha_cita}T00:00:00Z`);

    if (
        isNaN(fechaValidada.getTime()) ||
        fechaValidada.toISOString().slice(0, 10) !== fecha_cita
    ) {
        return res.status(400).json({
            mensaje: "La fecha proporcionada no es válida."
        });
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora_cita)) {
        return res.status(400).json({
            mensaje: "La hora debe tener el formato HH:MM."
        });
    }

    const dias = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado"
    ];

    const diaSemana = dias[fechaValidada.getUTCDay()];

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Evitar modificaciones simultáneas del mismo horario
        await client.query(
            `SELECT pg_advisory_xact_lock(
                hashtext($1),
                hashtext($2)
            )`,
            [String(id_dermatologo), fecha_cita]
        );

        // Comprobar que la cita existe y puede modificarse
        const citaActual = await client.query(
            `SELECT estado_cita
             FROM citas
             WHERE id_cita = $1`,
            [id]
        );

        if (citaActual.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                mensaje: "Cita no encontrada."
            });
        }

        if (!["PENDIENTE", "CONFIRMADA"].includes(
            citaActual.rows[0].estado_cita
        )) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                mensaje: "Solo se pueden modificar citas pendientes o confirmadas."
            });
        }

        // Comprobar dermatólogo activo
        const dermatologo = await client.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1
             AND estado = TRUE`,
            [id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                mensaje: "El dermatólogo no existe o está inactivo."
            });
        }

        // Comprobar servicio activo y obtener duración
        const servicio = await client.query(
            `SELECT duracion_minutos
             FROM servicios
             WHERE id_servicio = $1
             AND estado = TRUE`,
            [id_servicio]
        );

        if (servicio.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                mensaje: "El servicio no existe o está inactivo."
            });
        }

        const duracion = servicio.rows[0].duracion_minutos;

        // Comprobar disponibilidad del dermatólogo
        const horario = await client.query(
            `SELECT id_horario
             FROM horarios
             WHERE id_dermatologo = $1
             AND dia_semana = $2
             AND estado = TRUE
             AND $3::time >= hora_inicio
             AND $3::time +
                 ($4 * INTERVAL '1 minute') <= hora_fin
             LIMIT 1`,
            [
                id_dermatologo,
                diaSemana,
                hora_cita,
                duracion
            ]
        );

        if (horario.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                mensaje: "El dermatólogo no tiene disponibilidad para ese horario o el servicio excede su horario."
            });
        }

        // Comprobar cruces con otras citas
        const conflicto = await client.query(
            `SELECT c.id_cita
             FROM citas c
             INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
             WHERE c.id_dermatologo = $1
             AND c.fecha_cita = $2
             AND c.id_cita <> $3
             AND c.estado_cita IN ('PENDIENTE', 'CONFIRMADA')
             AND c.hora_cita <
                 ($4::time + ($5 * INTERVAL '1 minute'))
             AND (
                 c.hora_cita +
                 (s.duracion_minutos * INTERVAL '1 minute')
             ) > $4::time
             LIMIT 1`,
            [
                id_dermatologo,
                fecha_cita,
                id,
                hora_cita,
                duracion
            ]
        );

        if (conflicto.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                mensaje: "El dermatólogo ya tiene otra cita en ese horario."
            });
        }

        // Actualizar la cita
        const resultado = await client.query(
            `UPDATE citas
             SET id_dermatologo = $1,
                 id_servicio = $2,
                 fecha_cita = $3,
                 hora_cita = $4,
                 motivo_consulta = $5
             WHERE id_cita = $6
             RETURNING *`,
            [
                id_dermatologo,
                id_servicio,
                fecha_cita,
                hora_cita,
                motivo_consulta || null,
                id
            ]
        );

        await client.query("COMMIT");

        res.json({
            mensaje: "Cita modificada correctamente.",
            cita: resultado.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error al modificar cita:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "Ya existe una cita para ese dermatólogo en ese horario."
            });
        }

        res.status(500).json({
            mensaje: "No fue posible modificar la cita."
        });

    } finally {
        client.release();
    }
};

// ========================================
// CONSULTAR CITAS PENDIENTES
// ========================================
const obtenerCitasPendientes = async (req, res) => {
    try {
        const resultado = await pool.query(
            `${consultaCitas}
             WHERE c.estado_cita = 'PENDIENTE'
             ORDER BY c.fecha_cita ASC, c.hora_cita ASC`
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar citas pendientes:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar las citas pendientes."
        });
    }
};


module.exports = {
    obtenerCitas,
    obtenerCitaPorId,
    obtenerCitasPorFecha,
    obtenerCitasPorDermatologo,
    confirmarCita,
    actualizarCita,
    obtenerCitasPendientes
};
