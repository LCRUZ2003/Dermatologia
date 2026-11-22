
const pool = require("../config/db");

// ========================================
// REGISTRAR UN DERMATÓLOGO
// ========================================
const registrarDermatologo = async (req, res) => {
    const {
        nombres,
        apellidos,
        cedula,
        correo,
        telefono,
        descripcion,
        especialidades
    } = req.body;

    if (!nombres || !apellidos || !cedula || !correo) {
        return res.status(400).json({
            mensaje: "Completa los campos obligatorios."
        });
    }

    if (!Array.isArray(especialidades) || especialidades.length === 0) {
        return res.status(400).json({
            mensaje: "Debes asignar al menos una especialidad."
        });
    }

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        const resultado = await conexion.query(
            `INSERT INTO dermatologos
            (nombres, apellidos, cedula, correo, telefono, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                nombres,
                apellidos,
                cedula,
                correo,
                telefono || null,
                descripcion || null
            ]
        );

        const dermatologo = resultado.rows[0];

        for (const id of especialidades) {
            await conexion.query(
                `INSERT INTO dermatologo_especialidad
                (id_dermatologo, id_especialidad)
                VALUES ($1, $2)`,
                [dermatologo.id_dermatologo, id]
            );
        }

        await conexion.query("COMMIT");

        res.status(201).json({
            mensaje: "Dermatólogo registrado correctamente.",
            dermatologo
        });

    } catch (error) {
        await conexion.query("ROLLBACK");

        console.error("Error al registrar dermatólogo:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "La cédula o el correo ya están registrados."
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                mensaje: "Una de las especialidades seleccionadas no existe."
            });
        }

        res.status(500).json({
            mensaje: "Error interno al registrar el dermatólogo."
        });

    } finally {
        conexion.release();
    }
};


// ========================================
// CONSULTAR TODOS LOS DERMATÓLOGOS
// ========================================
const obtenerDermatologos = async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                d.*,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id_especialidad', e.id_especialidad,
                            'nombre', e.nombre
                        )
                    ) FILTER (WHERE e.id_especialidad IS NOT NULL),
                    '[]'
                ) AS especialidades
            FROM dermatologos d
            LEFT JOIN dermatologo_especialidad de
                ON d.id_dermatologo = de.id_dermatologo
            LEFT JOIN especialidades e
                ON de.id_especialidad = e.id_especialidad
            GROUP BY d.id_dermatologo
            ORDER BY d.id_dermatologo ASC
        `);

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar dermatólogos:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar los dermatólogos."
        });
    }
};


// ========================================
// CONSULTAR UN DERMATÓLOGO POR ID
// ========================================
const obtenerDermatologoPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(`
            SELECT
                d.*,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id_especialidad', e.id_especialidad,
                            'nombre', e.nombre
                        )
                    ) FILTER (WHERE e.id_especialidad IS NOT NULL),
                    '[]'
                ) AS especialidades
            FROM dermatologos d
            LEFT JOIN dermatologo_especialidad de
                ON d.id_dermatologo = de.id_dermatologo
            LEFT JOIN especialidades e
                ON de.id_especialidad = e.id_especialidad
            WHERE d.id_dermatologo = $1
            GROUP BY d.id_dermatologo
        `, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Dermatólogo no encontrado."
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al consultar dermatólogo:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar el dermatólogo."
        });
    }
};


// ========================================
// ACTUALIZAR UN DERMATÓLOGO
// ========================================
const actualizarDermatologo = async (req, res) => {
    const { id } = req.params;

    const {
        nombres,
        apellidos,
        cedula,
        correo,
        telefono,
        descripcion,
        especialidades
    } = req.body;

    if (!nombres || !apellidos || !cedula || !correo) {
        return res.status(400).json({
            mensaje: "Completa los campos obligatorios."
        });
    }

    if (!Array.isArray(especialidades) || especialidades.length === 0) {
        return res.status(400).json({
            mensaje: "Debes asignar al menos una especialidad."
        });
    }

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        const resultado = await conexion.query(
            `UPDATE dermatologos
            SET nombres = $1,
                apellidos = $2,
                cedula = $3,
                correo = $4,
                telefono = $5,
                descripcion = $6
            WHERE id_dermatologo = $7
            RETURNING *`,
            [
                nombres,
                apellidos,
                cedula,
                correo,
                telefono || null,
                descripcion || null,
                id
            ]
        );

        if (resultado.rows.length === 0) {
            await conexion.query("ROLLBACK");

            return res.status(404).json({
                mensaje: "Dermatólogo no encontrado."
            });
        }

        await conexion.query(
            `DELETE FROM dermatologo_especialidad
            WHERE id_dermatologo = $1`,
            [id]
        );

        for (const especialidad of especialidades) {
            await conexion.query(
                `INSERT INTO dermatologo_especialidad
                (id_dermatologo, id_especialidad)
                VALUES ($1, $2)`,
                [id, especialidad]
            );
        }

        await conexion.query("COMMIT");

        res.json({
            mensaje: "Dermatólogo actualizado correctamente.",
            dermatologo: resultado.rows[0]
        });

    } catch (error) {
        await conexion.query("ROLLBACK");

        console.error("Error al actualizar dermatólogo:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "La cédula o el correo ya están registrados."
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                mensaje: "Una de las especialidades seleccionadas no existe."
            });
        }

        res.status(500).json({
            mensaje: "Error al actualizar el dermatólogo."
        });

    } finally {
        conexion.release();
    }
};


// ========================================
// ELIMINAR UN DERMATÓLOGO
// ========================================
const eliminarDermatologo = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `DELETE FROM dermatologos
            WHERE id_dermatologo = $1
            RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Dermatólogo no encontrado."
            });
        }

        res.json({
            mensaje: "Dermatólogo eliminado correctamente."
        });

    } catch (error) {
        console.error("Error al eliminar dermatólogo:", error.message);

        res.status(500).json({
            mensaje: "Error al eliminar el dermatólogo."
        });
    }
};


module.exports = {
    registrarDermatologo,
    obtenerDermatologos,
    obtenerDermatologoPorId,
    actualizarDermatologo,
    eliminarDermatologo
};
