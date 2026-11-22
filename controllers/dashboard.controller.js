const pool = require("../config/db");

// ========================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD
// ========================================
const obtenerEstadisticas = async (req, res) => {
    try {
        // Estadísticas generales
        const resultado = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM citas) AS total_citas,

                (SELECT COUNT(*) FROM citas
                 WHERE estado_cita = 'PENDIENTE') AS citas_pendientes,

                (SELECT COUNT(*) FROM citas
                 WHERE estado_cita = 'CONFIRMADA') AS citas_confirmadas,

                (SELECT COUNT(*) FROM citas
                 WHERE estado_cita = 'COMPLETADA') AS citas_completadas,

                (SELECT COUNT(*) FROM citas
                 WHERE estado_cita = 'CANCELADA') AS citas_canceladas,

                (SELECT COUNT(*) FROM citas
                 WHERE fecha_cita = CURRENT_DATE) AS citas_hoy,

                (SELECT COUNT(*) FROM dermatologos
                 WHERE estado = TRUE) AS dermatologos_activos,

                (SELECT COUNT(*) FROM servicios
                 WHERE estado = TRUE) AS servicios_activos,

                (SELECT COUNT(*) FROM especialidades
                 WHERE estado = TRUE) AS especialidades_activas,

                 
                (SELECT COUNT(*)
                FROM usuarios u
                INNER JOIN roles r ON u.id_rol = r.id_rol
                WHERE r.codigo_rol = 'CLIENTE') AS total_clientes
        `);

        // Citas agrupadas por estado
        const citasPorEstado = await pool.query(`
            SELECT
                estado_cita,
                COUNT(*) AS cantidad
            FROM citas
            GROUP BY estado_cita
            ORDER BY estado_cita
        `);

        // Citas registradas por mes (últimos 12 meses)
        const citasPorMes = await pool.query(`
            SELECT
                TO_CHAR(
                    DATE_TRUNC('month', fecha_cita),
                    'YYYY-MM'
                ) AS mes,
                COUNT(*) AS cantidad
            FROM citas
            WHERE fecha_cita >=
                DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
            GROUP BY DATE_TRUNC('month', fecha_cita)
            ORDER BY DATE_TRUNC('month', fecha_cita)
        `);

        // Citas agrupadas por dermatólogo
        const citasPorDermatologo = await pool.query(`
            SELECT
                d.id_dermatologo,
                d.nombres,
                d.apellidos,
                COUNT(c.id_cita) AS cantidad_citas
            FROM dermatologos d
            LEFT JOIN citas c
                ON d.id_dermatologo = c.id_dermatologo
            GROUP BY
                d.id_dermatologo,
                d.nombres,
                d.apellidos
            ORDER BY cantidad_citas DESC
        `);

        res.json({
            mensaje: "Estadísticas obtenidas correctamente.",
            estadisticas: resultado.rows[0],
            citas_por_estado: citasPorEstado.rows,
            citas_por_mes: citasPorMes.rows,
            citas_por_dermatologo: citasPorDermatologo.rows
        });

    } catch (error) {
        console.error(
            "Error al obtener estadísticas:",
            error.message
        );

        res.status(500).json({
            mensaje: "Error al obtener las estadísticas del dashboard."
        });
    }
};

module.exports = {
    obtenerEstadisticas
};