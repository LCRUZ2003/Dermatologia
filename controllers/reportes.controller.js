
const pool = require("../config/db");
const PDFDocument = require("pdfkit");

// ========================================
// GENERAR DOCUMENTO PDF
// ========================================
const generarPDF = (res, nombreArchivo, titulo, columnas, registros) => {

    const doc = new PDFDocument({
        size: "A4",
        margin: 40
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${nombreArchivo}.pdf`
    );

    doc.pipe(res);

    const ancho = doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const encabezado = () => {
        doc.fontSize(18)
            .font("Helvetica-Bold")
            .text("CLÍNICA DERMATOLÓGICA", {
                align: "center"
            });

        doc.moveDown(0.5);

        doc.fontSize(14)
            .text(titulo, { align: "center" });

        doc.moveDown(0.5);

        doc.fontSize(9)
            .font("Helvetica")
            .text(
                `Fecha de generación: ${new Date().toLocaleString("es-DO")}`
            );

        doc.moveDown();

        doc.moveTo(40, doc.y)
            .lineTo(doc.page.width - 40, doc.y)
            .stroke();

        doc.moveDown();
    };

    encabezado();

    if (registros.length === 0) {
        doc.fontSize(11)
            .text("No existen registros para este reporte.");
    } else {

        registros.forEach((registro, index) => {

            const contenido = columnas.map((columna, i) => {
                return `${columna}: ${registro[i] ?? "No especificado"}`;
            }).join(" | ");

            const linea = `${index + 1}. ${contenido}`;

            doc.fontSize(9)
                .font("Helvetica");

            const altura = doc.heightOfString(linea, {
                width: ancho
            });

            if (doc.y + altura + 20 >
                doc.page.height - doc.page.margins.bottom) {

                doc.addPage();
                encabezado();
            }

            doc.text(linea, {
                width: ancho
            });

            doc.moveDown(0.7);
        });
    }

    doc.end();
};

// ========================================
// REPORTE DE CITAS
// ========================================

const reporteCitas = async (req, res) => {
    try {
        const { desde, hasta, estado } = req.query;

        // Validar formato de fechas
        const validarFecha = (fecha) => {
            if (!fecha) return true;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return false;
            }

            const fechaValida = new Date(`${fecha}T00:00:00Z`);

            return !isNaN(fechaValida.getTime()) &&
                fechaValida.toISOString().slice(0, 10) === fecha;
        };

        if (!validarFecha(desde) || !validarFecha(hasta)) {
            return res.status(400).json({
                mensaje: "Las fechas deben tener el formato YYYY-MM-DD."
            });
        }

        if (desde && hasta && desde > hasta) {
            return res.status(400).json({
                mensaje: "La fecha inicial no puede ser posterior a la fecha final."
            });
        }

        const estadosPermitidos = [
            "PENDIENTE",
            "CONFIRMADA",
            "COMPLETADA",
            "CANCELADA"
        ];

        if (estado && !estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                mensaje: "El estado de la cita no es válido."
            });
        }

        let consulta = `
            SELECT
                c.id_cita,
                c.id_usuario,
                d.nombres || ' ' || d.apellidos AS dermatologo,
                s.nombre AS servicio,
                TO_CHAR(c.fecha_cita, 'DD/MM/YYYY') AS fecha,
                TO_CHAR(c.hora_cita, 'HH24:MI') AS hora,
                c.estado_cita
            FROM citas c
            INNER JOIN dermatologos d
                ON c.id_dermatologo = d.id_dermatologo
            INNER JOIN servicios s
                ON c.id_servicio = s.id_servicio
            WHERE 1 = 1
        `;

        const valores = [];

        if (desde) {
            valores.push(desde);
            consulta += ` AND c.fecha_cita >= $${valores.length}`;
        }

        if (hasta) {
            valores.push(hasta);
            consulta += ` AND c.fecha_cita <= $${valores.length}`;
        }

        if (estado) {
            valores.push(estado);
            consulta += ` AND c.estado_cita = $${valores.length}`;
        }

        consulta += `
            ORDER BY c.fecha_cita DESC, c.hora_cita DESC
        `;

        const resultado = await pool.query(consulta, valores);

        generarPDF(
            res,
            "reporte_citas",
            "REPORTE DE CITAS",
            [
                "ID Cita",
                "ID Usuario",
                "Dermatólogo",
                "Servicio",
                "Fecha",
                "Hora",
                "Estado"
            ],
            resultado.rows.map(c => [
                c.id_cita,
                c.id_usuario,
                c.dermatologo,
                c.servicio,
                c.fecha,
                c.hora,
                c.estado_cita
            ])
        );

    } catch (error) {
        console.error("Error en reporte de citas:", error.message);

        res.status(500).json({
            mensaje: "No fue posible generar el reporte de citas."
        });
    }
};

// ========================================
// REPORTE DE DERMATÓLOGOS
// ========================================
const reporteDermatologos = async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id_dermatologo,
                nombres,
                apellidos,
                cedula,
                correo,
                telefono,
                CASE
                    WHEN estado = TRUE THEN 'ACTIVO'
                    ELSE 'INACTIVO'
                END AS estado
            FROM dermatologos
            ORDER BY nombres ASC
        `);

        generarPDF(
            res,
            "reporte_dermatologos",
            "REPORTE DE DERMATÓLOGOS",
            [
                "ID",
                "Nombres",
                "Apellidos",
                "Cédula",
                "Correo",
                "Teléfono",
                "Estado"
            ],
            resultado.rows.map(d => [
                d.id_dermatologo,
                d.nombres,
                d.apellidos,
                d.cedula,
                d.correo,
                d.telefono,
                d.estado
            ])
        );

    } catch (error) {
        console.error("Error en reporte de dermatólogos:", error.message);
        res.status(500).json({
            mensaje: "No fue posible generar el reporte de dermatólogos."
        });
    }
};

// ========================================
// REPORTE DE SERVICIOS
// ========================================
const reporteServicios = async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id_servicio,
                nombre,
                descripcion,
                precio,
                duracion_minutos,
                CASE
                    WHEN estado = TRUE THEN 'ACTIVO'
                    ELSE 'INACTIVO'
                END AS estado
            FROM servicios
            ORDER BY nombre ASC
        `);

        generarPDF(
            res,
            "reporte_servicios",
            "REPORTE DE SERVICIOS",
            [
                "ID",
                "Servicio",
                "Descripción",
                "Precio",
                "Duración (minutos)",
                "Estado"
            ],
            resultado.rows.map(s => [
                s.id_servicio,
                s.nombre,
                s.descripcion,
                s.precio,
                s.duracion_minutos,
                s.estado
            ])
        );

    } catch (error) {
        console.error("Error en reporte de servicios:", error.message);
        res.status(500).json({
            mensaje: "No fue posible generar el reporte de servicios."
        });
    }
};

// ========================================
// REPORTE DE ESPECIALIDADES
// ========================================
const reporteEspecialidades = async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                id_especialidad,
                nombre,
                descripcion,
                CASE
                    WHEN estado = TRUE THEN 'ACTIVA'
                    ELSE 'INACTIVA'
                END AS estado
            FROM especialidades
            ORDER BY nombre ASC
        `);

        generarPDF(
            res,
            "reporte_especialidades",
            "REPORTE DE ESPECIALIDADES",
            [
                "ID",
                "Especialidad",
                "Descripción",
                "Estado"
            ],
            resultado.rows.map(e => [
                e.id_especialidad,
                e.nombre,
                e.descripcion,
                e.estado
            ])
        );

    } catch (error) {
        console.error("Error en reporte de especialidades:", error.message);
        res.status(500).json({
            mensaje: "No fue posible generar el reporte de especialidades."
        });
    }
};

module.exports = {
    reporteCitas,
    reporteDermatologos,
    reporteServicios,
    reporteEspecialidades
};
