
// Cargar las variables de entorno
require("dotenv").config();

// Importar Express
const express = require("express");

// Importar CORS
const cors = require("cors");

// Importar la conexión con PostgreSQL
const pool = require("./config/db");

// Importar las rutas de usuarios
const usuariosRoutes = require("./routes/usuarios.routes");

// Importar las rutas de citas
const citasRoutes = require("./routes/citas.routes");

// Importar las rutas del sistema
const dermatologosRoutes = require("./routes/dermatologos.routes");
const especialidadesRoutes = require("./routes/especialidades.routes");
const serviciosRoutes = require("./routes/servicios.routes");
const horariosRoutes = require("./routes/horarios.routes");
const citasAdminRoutes = require("./routes/citas.admin.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportesRoutes = require("./routes/reportes.routes");

// Importar Path
const path = require("path");

// Crear la aplicación
const app = express();

// ========================================
// CONFIGURACIONES DEL SERVIDOR
// ========================================

// Configuración de CORS
app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Permitir recibir datos en formato JSON
app.use(express.json());

// ========================================
// REGISTRO DE RUTAS
// ========================================

// Rutas de dermatólogos
app.use("/api/dermatologos", dermatologosRoutes);

// Rutas de especialidades
app.use("/api/especialidades", especialidadesRoutes);

// Rutas de servicios
app.use("/api/servicios", serviciosRoutes);

// Rutas de horarios
app.use("/api/horarios", horariosRoutes);
// app.use("/api/horarios", require("./routes/horarios.routes"));

// Rutas administrativas
app.use("/api/admin/citas", citasAdminRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/reportes", reportesRoutes);

// Rutas de usuarios
app.use("/api/usuarios", usuariosRoutes);

// Rutas de citas
app.use("/api/citas", citasRoutes);

// Servir archivos del frontend
app.use(express.static(path.join(__dirname, "frontend")));

console.log("Rutas de usuarios cargadas correctamente");

// ========================================
// RUTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
    res.json({
        mensaje: "Bienvenido al sistema de la Clínica Dermatológica"
    });
});

// ========================================
// ESTADO DEL SERVIDOR Y BASE DE DATOS
// ========================================

app.get("/api/estado", async (req, res) => {
    try {
        await pool.query("SELECT NOW()");

        res.json({
            servidor: "Funcionando",
            baseDatos: "Conectada"
        });

    } catch (error) {
        console.error("Error de conexión:", error.message);

        res.status(500).json({
            servidor: "Funcionando",
            baseDatos: "Error de conexión"
        });
    }
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});