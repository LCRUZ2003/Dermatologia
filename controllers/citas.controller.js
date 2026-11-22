
// Importar la conexión con PostgreSQL
const pool = require("../config/db");

// Registrar una nueva cita
const registrarCita = async (req, res) => {
    try {
        // Obtener los datos enviados desde el formulario
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

        // Obtener la duración del servicio en minutos
        const duracionServicio = Number(servicio.rows[0].duracion_minutos);

        // Validar que la fecha tenga el formato correcto
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_cita)) {
            return res.status(400).json({
                mensaje: "La fecha de la cita no tiene un formato válido."
            });
        }

        // Comprobar que la fecha exista realmente
        const fechaSeleccionada = new Date(`${fecha_cita}T12:00:00`);

        if (
            Number.isNaN(fechaSeleccionada.getTime()) ||
            fechaSeleccionada.toISOString().slice(0, 10) !== fecha_cita
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

        // Validar el formato de la hora
        if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora_cita)) {
            return res.status(400).json({
                mensaje: "La hora seleccionada no es válida."
            });
        }

        // Obtener el día de la semana de la cita
        const diasSemana = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miercoles",
            "Jueves",
            "Viernes",
            "Sabado"
        ];

        const diaSemana = diasSemana[fechaSeleccionada.getDay()];

        // Consultar el horario del dermatólogo para ese día
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

        // Obtener el horario del dermatólogo
        const horaInicio = horario.rows[0].hora_inicio;
        const horaFin = horario.rows[0].hora_fin;

        // Convertir la hora seleccionada a minutos
        const [horas, minutos] = hora_cita.split(":").map(Number);

        const minutosInicio = (horas * 60) + minutos;

        // Calcular la hora de finalización
        const minutosFin = minutosInicio + duracionServicio;

        // Convertir el horario de inicio a minutos
        const [horasInicio, minutosInicioHorario] = horaInicio.split(":").map(Number);

        const minutosInicioHorarioTotal =
            (horasInicio * 60) + minutosInicioHorario;

        // Convertir el horario de cierre a minutos
        const [horasFin, minutosCierre] = horaFin.split(":").map(Number);

        const minutosCierreTotal =
            (horasFin * 60) + minutosCierre;

        // Verificar que la hora seleccionada esté dentro del horario
        if (
            minutosInicio < minutosInicioHorarioTotal ||
            minutosInicio >= minutosCierreTotal
        ) {
            return res.status(400).json({
                mensaje: "La hora seleccionada está fuera del horario de atención."
            });
        }

        // Verificar que el servicio termine dentro del horario
        if (minutosFin > minutosCierreTotal) {
            return res.status(400).json({
                mensaje: "La duración del servicio excede el horario de atención del dermatólogo."
            });
        }

        // Verificar si existe otra cita en ese horario
        const citaExistente = await pool.query(
            `SELECT c.id_cita
             FROM citas c
             INNER JOIN servicios s ON c.id_servicio = s.id_servicio
             WHERE c.id_dermatologo = $1
             AND c.fecha_cita = $2
             AND c.estado_cita <> 'CANCELADA'
             AND c.hora_cita < ($3::TIME + ($4 * INTERVAL '1 minute'))
             AND (c.hora_cita + (s.duracion_minutos * INTERVAL '1 minute')) > $3::TIME`,
            [id_dermatologo, fecha_cita, hora_cita, duracionServicio]
        );

        if (citaExistente.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El dermatólogo ya tiene una cita programada en ese horario."
            });
        }

        // Obtener el identificador del cliente autenticado
        const id_usuario = req.usuario.id_usuario;

        // Registrar la cita en la base de datos
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

        // Enviar respuesta de confirmación
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

// Consultar las citas del cliente autenticado
const consultarMisCitas = async (req, res) => {
    try {
        // Obtener el ID del cliente desde el token
        const id_usuario = req.usuario.id_usuario;

        // Consultar las citas del cliente
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

        // Enviar las citas encontradas
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


// Cancelar una cita del cliente autenticado
const cancelarCita = async (req, res) => {
    try {
        // Obtener el ID de la cita desde la URL
        const { id } = req.params;

        // Obtener el ID del cliente desde el token
        const id_usuario = req.usuario.id_usuario;

        // Verificar que el ID sea un número entero positivo
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                mensaje: "El identificador de la cita no es válido."
            });
        }

        // Buscar la cita perteneciente al cliente
        const resultado = await pool.query(
            `SELECT id_cita, estado_cita
             FROM citas
             WHERE id_cita = $1
             AND id_usuario = $2`,
            [id, id_usuario]
        );

        // Comprobar que la cita exista y pertenezca al cliente
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la cita solicitada."
            });
        }

        const cita = resultado.rows[0];

        // Verificar que la cita no esté cancelada
        if (cita.estado_cita === "CANCELADA") {
            return res.status(400).json({
                mensaje: "Esta cita ya se encuentra cancelada."
            });
        }

        // Verificar que la cita no esté completada
        if (cita.estado_cita === "COMPLETADA") {
            return res.status(400).json({
                mensaje: "No puedes cancelar una cita que ya fue completada."
            });
        }

        // Actualizar el estado de la cita
        const citaCancelada = await pool.query(
            `UPDATE citas
             SET estado_cita = 'CANCELADA'
             WHERE id_cita = $1
             AND id_usuario = $2
             RETURNING *`,
            [id, id_usuario]
        );

        // Enviar respuesta de confirmación
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


// Exportar las funciones del controlador
module.exports = {
    registrarCita,
    consultarMisCitas,
    cancelarCita
};

