
const pool = require("../config/db");

// ========================================
// REGISTRAR UNA NUEVA CITA
// ========================================
const registrarCita = async (req, res) => {
    try {
        const {
            id_dermatologo,
            id_servicio,
            fecha_cita,
            hora_cita,
            motivo_consulta
        } = req.body;

        // Validar campos obligatorios
        if (!id_dermatologo || !id_servicio || !fecha_cita || !hora_cita) {
            return res.status(400).json({
                mensaje: "Debes completar todos los campos obligatorios."
            });
        }

        // Validar longitud del motivo de consulta
        if (motivo_consulta && (
            typeof motivo_consulta !== "string" ||
            motivo_consulta.length > 500
        )) {
            return res.status(400).json({
                mensaje: "El motivo de consulta debe ser un texto de máximo 500 caracteres."
            });
        }

        // Verificar si el dermatólogo existe y está activo
        const dermatologo = await pool.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1
             AND estado = TRUE`,
            [id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El dermatólogo seleccionado no existe o no está disponible."
            });
        }

        // Verificar si el servicio existe y está activo
        const servicio = await pool.query(
            `SELECT id_servicio, duracion_minutos
             FROM servicios
             WHERE id_servicio = $1
             AND estado = TRUE`,
            [id_servicio]
        );

        if (servicio.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El servicio seleccionado no existe o no está disponible."
            });
        }

        // Obtener duración del servicio
        const duracionServicio = Number(servicio.rows[0].duracion_minutos);

        if (!Number.isFinite(duracionServicio) || duracionServicio <= 0) {
            return res.status(400).json({
                mensaje: "La duración del servicio no es válida."
            });
        }

        // Validar formato de fecha
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_cita)) {
            return res.status(400).json({
                mensaje: "La fecha de la cita no tiene un formato válido."
            });
        }

        // Comprobar que la fecha exista realmente
        const [anio, mes, dia] = fecha_cita.split("-").map(Number);

        const fechaSeleccionada = new Date(
            Date.UTC(anio, mes - 1, dia)
        );

        if (
            fechaSeleccionada.getUTCFullYear() !== anio ||
            fechaSeleccionada.getUTCMonth() !== mes - 1 ||
            fechaSeleccionada.getUTCDate() !== dia
        ) {
            return res.status(400).json({
                mensaje: "La fecha seleccionada no es válida."
            });
        }

        // Verificar que la fecha no sea anterior al día actual
        const fechaActual = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Santo_Domingo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        if (fecha_cita < fechaActual) {
            return res.status(400).json({
                mensaje: "No puedes registrar una cita para una fecha pasada."
            });
        }

        // Obtener el día de la semana
        const diasSemana = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miercoles",
            "Jueves",
            "Viernes",
            "Sabado"
        ];

        const diaSemana = diasSemana[fechaSeleccionada.getUTCDay()];

        // No permitir citas los domingos
        if (diaSemana === "Domingo") {
            return res.status(400).json({
                mensaje: "No se pueden solicitar citas los domingos."
            });
        }

        // Validar formato de hora
        if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora_cita)) {
            return res.status(400).json({
                mensaje: "La hora seleccionada no es válida."
            });
        }

        // Convertir hora a minutos
        const [horas, minutos] = hora_cita.split(":").map(Number);

        const minutosInicio = (horas * 60) + minutos;
        const minutosFin = minutosInicio + duracionServicio;

        // Las citas deben comenzar en intervalos de 30 minutos
        if (minutos % 30 !== 0) {
            return res.status(400).json({
                mensaje: "Las citas deben comenzar en intervalos de 30 minutos."
            });
        }

        // Horario general de la clínica
        const APERTURA = 8 * 60;
        const CIERRE = 18 * 60;

        // Validar hora de inicio
        if (minutosInicio < APERTURA || minutosInicio >= CIERRE) {
            return res.status(400).json({
                mensaje: "El horario de atención es de lunes a sábado, de 8:00 a. m. a 6:00 p. m."
            });
        }

        // Validar que el servicio termine antes del cierre
        if (minutosFin > CIERRE) {
            return res.status(400).json({
                mensaje: "La duración del servicio excede el horario de atención de la clínica."
            });
        }

        // Consultar todos los horarios activos del dermatólogo para ese día
        const horario = await pool.query(
            `SELECT hora_inicio, hora_fin
             FROM horarios
             WHERE id_dermatologo = $1
             AND dia_semana = $2
             AND estado = TRUE`,
            [id_dermatologo, diaSemana]
        );

        if (horario.rows.length === 0) {
            return res.status(400).json({
                mensaje: "El dermatólogo no tiene horario disponible para ese día."
            });
        }

        // Comprobar que la cita completa quepa en al menos un intervalo
        const horarioValido = horario.rows.some(h => {
            const horaInicio = String(h.hora_inicio).substring(0, 5);
            const horaFin = String(h.hora_fin).substring(0, 5);

            const [hi, mi] = horaInicio.split(":").map(Number);
            const [hf, mf] = horaFin.split(":").map(Number);

            const inicioHorario = (hi * 60) + mi;
            const finHorario = (hf * 60) + mf;

            const inicioPermitido = Math.max(inicioHorario, APERTURA);
            const finPermitido = Math.min(finHorario, CIERRE);

            return (
                minutosInicio >= inicioPermitido &&
                minutosFin <= finPermitido
            );
        });

        if (!horarioValido) {
            return res.status(400).json({
                mensaje: "El dermatólogo no tiene disponibilidad para esa hora o el servicio excede su horario."
            });
        }

        // Verificar si existe otra cita que se cruce con el horario solicitado
        const citaExistente = await pool.query(
            `SELECT c.id_cita
             FROM citas c
             INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
             WHERE c.id_dermatologo = $1
             AND c.fecha_cita = $2
             AND c.estado_cita <> 'CANCELADA'
             AND c.hora_cita < ($3::TIME + ($4 * INTERVAL '1 minute'))
             AND (
                c.hora_cita +
                (s.duracion_minutos * INTERVAL '1 minute')
             ) > $3::TIME`,
            [id_dermatologo, fecha_cita, hora_cita, duracionServicio]
        );

        if (citaExistente.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El dermatólogo ya tiene una cita programada en ese horario."
            });
        }

        // Obtener el identificador del cliente autenticado
        const id_usuario = req.usuario.id_usuario;

        // Registrar la cita
        const nuevaCita = await pool.query(
            `INSERT INTO citas (
                id_usuario,
                id_dermatologo,
                id_servicio,
                fecha_cita,
                hora_cita,
                motivo_consulta
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                id_usuario,
                id_dermatologo,
                id_servicio,
                fecha_cita,
                hora_cita,
                motivo_consulta || null
            ]
        );

        res.status(201).json({
            mensaje: "Cita registrada correctamente.",
            cita: nuevaCita.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar cita:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al registrar la cita."
        });
    }
};


// ========================================
// CONSULTAR HORAS DISPONIBLES
// ========================================
const obtenerDisponibilidad = async (req, res) => {
    try {
        const {
            id_dermatologo,
            id_servicio,
            fecha_cita
        } = req.query;

        if (!id_dermatologo || !id_servicio || !fecha_cita) {
            return res.status(400).json({
                mensaje: "Debes indicar el dermatólogo, el servicio y la fecha."
            });
        }

        // Validar formato de fecha
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_cita)) {
            return res.status(400).json({
                mensaje: "La fecha seleccionada no es válida."
            });
        }

        const [anio, mes, dia] = fecha_cita.split("-").map(Number);

        const fechaSeleccionada = new Date(
            Date.UTC(anio, mes - 1, dia)
        );

        if (
            fechaSeleccionada.getUTCFullYear() !== anio ||
            fechaSeleccionada.getUTCMonth() !== mes - 1 ||
            fechaSeleccionada.getUTCDate() !== dia
        ) {
            return res.status(400).json({
                mensaje: "La fecha seleccionada no existe."
            });
        }

        // Obtener fecha actual de República Dominicana
        const fechaActual = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Santo_Domingo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        if (fecha_cita < fechaActual) {
            return res.status(400).json({
                mensaje: "No puedes consultar horarios de fechas pasadas."
            });
        }

        const diasSemana = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miercoles",
            "Jueves",
            "Viernes",
            "Sabado"
        ];

        const diaSemana = diasSemana[fechaSeleccionada.getUTCDay()];

        if (diaSemana === "Domingo") {
            return res.json({
                mensaje: "No hay atención los domingos.",
                horas_disponibles: []
            });
        }

        // Verificar que el dermatólogo esté activo
        const dermatologo = await pool.query(
            `SELECT id_dermatologo
             FROM dermatologos
             WHERE id_dermatologo = $1
             AND estado = TRUE`,
            [id_dermatologo]
        );

        if (dermatologo.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El dermatólogo no está disponible."
            });
        }

        // Obtener duración del servicio
        const servicio = await pool.query(
            `SELECT duracion_minutos
             FROM servicios
             WHERE id_servicio = $1
             AND estado = TRUE`,
            [id_servicio]
        );

        if (servicio.rows.length === 0) {
            return res.status(404).json({
                mensaje: "El servicio seleccionado no está disponible."
            });
        }

        const duracion = Number(servicio.rows[0].duracion_minutos);

        // Obtener horarios activos del dermatólogo
        const horarios = await pool.query(
            `SELECT hora_inicio, hora_fin
             FROM horarios
             WHERE id_dermatologo = $1
             AND dia_semana = $2
             AND estado = TRUE`,
            [id_dermatologo, diaSemana]
        );

        if (horarios.rows.length === 0) {
            return res.json({
                mensaje: "El dermatólogo no tiene horario para ese día.",
                horas_disponibles: []
            });
        }

        // Obtener citas existentes que no estén canceladas
        const citas = await pool.query(
            `SELECT
                c.hora_cita,
                s.duracion_minutos
             FROM citas c
             INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
             WHERE c.id_dermatologo = $1
             AND c.fecha_cita = $2
             AND c.estado_cita <> 'CANCELADA'`,
            [id_dermatologo, fecha_cita]
        );

        const APERTURA = 8 * 60;
        const CIERRE = 18 * 60;

        // Obtener hora actual de República Dominicana
        const horaActual = new Intl.DateTimeFormat("en-GB", {
            timeZone: "America/Santo_Domingo",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
        }).format(new Date());

        const [horaActualH, horaActualM] = horaActual.split(":").map(Number);
        const minutosActuales = (horaActualH * 60) + horaActualM;

        const horasDisponibles = new Set();

        // Revisar cada horario del dermatólogo
        horarios.rows.forEach(horario => {
            const [hi, mi] = String(horario.hora_inicio)
                .substring(0, 5).split(":").map(Number);

            const [hf, mf] = String(horario.hora_fin)
                .substring(0, 5).split(":").map(Number);

            const inicioHorario = Math.max((hi * 60) + mi, APERTURA);
            const finHorario = Math.min((hf * 60) + mf, CIERRE);

            // Comenzar en el siguiente intervalo de 30 minutos
            let inicio = Math.ceil(inicioHorario / 30) * 30;

            while (inicio + duracion <= finHorario) {

                // No mostrar horas que ya pasaron si es hoy
                if (
                    fecha_cita !== fechaActual ||
                    inicio > minutosActuales
                ) {
                    // Verificar que no se cruce con otra cita
                    const ocupado = citas.rows.some(cita => {
                        const [hc, mc] = String(cita.hora_cita)
                            .substring(0, 5).split(":").map(Number);

                        const inicioCita = (hc * 60) + mc;
                        const finCita = inicioCita +
                            Number(cita.duracion_minutos);

                        return (
                            inicio < finCita &&
                            inicio + duracion > inicioCita
                        );
                    });

                    if (!ocupado) {
                        const hora = String(Math.floor(inicio / 60))
                            .padStart(2, "0");

                        const minuto = String(inicio % 60)
                            .padStart(2, "0");

                        horasDisponibles.add(`${hora}:${minuto}`);
                    }
                }

                inicio += 30;
            }
        });

        const resultado = [...horasDisponibles].sort();

        res.json({
            mensaje: "Disponibilidad consultada correctamente.",
            horas_disponibles: resultado
        });

    } catch (error) {
        console.error("Error al consultar disponibilidad:", error);

        res.status(500).json({
            mensaje: "Ocurrió un error al consultar los horarios disponibles."
        });
    }
};


// ========================================
// CONSULTAR LAS CITAS DEL CLIENTE
// ========================================
const consultarMisCitas = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const resultado = await pool.query(
            `SELECT
                c.id_cita,
                c.fecha_cita,
                c.hora_cita,
                c.estado_cita,
                c.motivo_consulta,
                d.nombres AS nombre_dermatologo,
                d.apellidos AS apellido_dermatologo,
                s.nombre AS nombre_servicio,
                s.precio,
                s.duracion_minutos
            FROM citas c
            INNER JOIN dermatologos d
                ON c.id_dermatologo = d.id_dermatologo
            INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
            WHERE c.id_usuario = $1
            ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
            [id_usuario]
        );

        res.json({
            mensaje: "Consulta de citas realizada correctamente.",
            total: resultado.rows.length,
            citas: resultado.rows
        });

    } catch (error) {
        console.error("Error al consultar citas:", error);

        res.status(500).json({
            mensaje: "Ocurrió un error al consultar las citas."
        });
    }
};


// ========================================
// CANCELAR UNA CITA
// ========================================
const cancelarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario.id_usuario;

        // Validar identificador
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                mensaje: "El identificador de la cita no es válido."
            });
        }

        // Buscar cita perteneciente al cliente
        const resultado = await pool.query(
            `SELECT id_cita, estado_cita
             FROM citas
             WHERE id_cita = $1
             AND id_usuario = $2`,
            [id, id_usuario]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la cita solicitada."
            });
        }

        const cita = resultado.rows[0];

        if (cita.estado_cita === "CANCELADA") {
            return res.status(400).json({
                mensaje: "Esta cita ya se encuentra cancelada."
            });
        }

        if (cita.estado_cita === "COMPLETADA") {
            return res.status(400).json({
                mensaje: "No puedes cancelar una cita que ya fue completada."
            });
        }

        // Actualizar estado de la cita
        const citaCancelada = await pool.query(
            `UPDATE citas
             SET estado_cita = 'CANCELADA'
             WHERE id_cita = $1
             AND id_usuario = $2
             RETURNING *`,
            [id, id_usuario]
        );

        res.json({
            mensaje: "La cita ha sido cancelada correctamente.",
            cita: citaCancelada.rows[0]
        });

    } catch (error) {
        console.error("Error al cancelar cita:", error);

        res.status(500).json({
            mensaje: "Ocurrió un error al cancelar la cita."
        });
    }
};


// ========================================
// EXPORTAR FUNCIONES
// ========================================
module.exports = {
    registrarCita,
    obtenerDisponibilidad,
    consultarMisCitas,
    cancelarCita
};
