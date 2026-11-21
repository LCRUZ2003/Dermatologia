
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Registrar un nuevo cliente
const registrarUsuario = async (req, res) => {
    try {
        // Obtener los datos enviados desde el formulario
        const { nombre_usuario, correo_usuario, password_usuario } = req.body;

        // Validar que los campos estén completos
        if (!nombre_usuario || !correo_usuario || !password_usuario) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios."
            });
        }

        // Validar la longitud de la contraseña
        if (password_usuario.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres."
            });
        }

        // Preparar los datos
        const nombre = nombre_usuario.trim();
        const correo = correo_usuario.trim().toLowerCase();

        // Verificar si el correo ya está registrado
        const usuarioExistente = await pool.query(
            "SELECT id_usuario FROM usuarios WHERE correo_usuario = $1",
            [correo]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                mensaje: "Este correo electrónico ya está registrado."
            });
        }

        // Buscar el rol CLIENTE activo
        const resultadoRol = await pool.query(
            `SELECT id_rol FROM roles
             WHERE codigo_rol = $1 AND estado_rol = $2`,
            ["CLIENTE", "ACTIVO"]
        );

        if (resultadoRol.rows.length === 0) {
            return res.status(500).json({
                mensaje: "No se encontró un rol de cliente activo."
            });
        }

        const idRol = resultadoRol.rows[0].id_rol;

        // Encriptar la contraseña mediante un hash
        const passwordHash = await bcrypt.hash(password_usuario, 10);

        // Registrar el usuario en PostgreSQL
        const nuevoUsuario = await pool.query(
            `INSERT INTO usuarios
            (nombre_usuario, correo_usuario, password_usuario, id_rol)
            VALUES ($1, $2, $3, $4)
            RETURNING id_usuario, nombre_usuario, correo_usuario, id_rol, fecha_registro`,
            [nombre, correo, passwordHash, idRol]
        );

        // Responder con los datos del usuario registrado
        res.status(201).json({
            mensaje: "Cliente registrado correctamente.",
            usuario: nuevoUsuario.rows[0]
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al registrar el cliente."
        });
    }
}; // Fin de la función registrarUsuario

// Iniciar sesión de un usuario
const iniciarSesion = async (req, res) => {
    try {
        const { correo_usuario, password_usuario } = req.body;

        // Validar los campos obligatorios
        if (!correo_usuario || !password_usuario) {
            return res.status(400).json({
                mensaje: "El correo y la contraseña son obligatorios."
            });
        }

        const correo = correo_usuario.trim().toLowerCase();

        // Buscar el usuario y su rol
        const resultado = await pool.query(
            `SELECT
                u.id_usuario,
                u.nombre_usuario,
                u.correo_usuario,
                u.password_usuario,
                r.codigo_rol,
                r.nombre_rol
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.correo_usuario = $1
            AND r.estado_rol = $2`,
            [correo, "ACTIVO"]
        );

        // Comprobar si existe el usuario
        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos."
            });
        }

        const usuario = resultado.rows[0];

        // Comparar la contraseña ingresada con la almacenada
        const passwordValida = await bcrypt.compare(
            password_usuario,
            usuario.password_usuario
        );

        if (!passwordValida) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos."
            });
        }

        // Generar el token de autenticación
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                correo_usuario: usuario.correo_usuario,
                codigo_rol: usuario.codigo_rol
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        // Responder con los datos del usuario y el token
        res.json({
            mensaje: "Inicio de sesión exitoso.",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_usuario: usuario.nombre_usuario,
                correo_usuario: usuario.correo_usuario,
                nombre_rol: usuario.nombre_rol,
                codigo_rol: usuario.codigo_rol
            }
        });

    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al iniciar sesión."
        });
    }
};// Fin de la función iniciarSesion


// Exportar las funciones
module.exports = {
    registrarUsuario,
    iniciarSesion
};
