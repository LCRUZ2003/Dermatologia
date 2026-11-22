
// Cargar las variables de entorno
require("dotenv").config();

// Importar Express
const express = require("express");

// Importar la conexión con PostgreSQL
const pool = require("./config/db");
// Importar las rutas de usuarios
const usuariosRoutes = require("./routes/usuarios.routes");
// Importar las rutas de citas
const citasRoutes = require("./routes/citas.routes");

// Crear la aplicación
const app = express();

// Permitir recibir datos en formato JSON
app.use(express.json());

// Rutas
const dermatologosRoutes = require("./routes/dermatologos.routes");
const especialidadesRoutes = require("./routes/especialidades.routes");
const serviciosRoutes = require("./routes/servicios.routes");
const horariosRoutes = require("./routes/horarios.routes");
const citasAdminRoutes = require("./routes/citas.admin.routes"); 
const dashboardRoutes = require("./routes/dashboard.routes");
const reportesRoutes = require("./routes/reportes.routes");
const path = require("path");

// Registrar rutas de la API
app.use("/api/dermatologos", dermatologosRoutes); 
app.use("/api/especialidades", especialidadesRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/horarios", horariosRoutes); 
app.use("/api/admin/citas", citasAdminRoutes);
app.use("/api/admin/dashboard", dashboardRoutes); 
app.use("/api/admin/reportes", reportesRoutes); 
app.use(express.static(path.join(__dirname, "frontend"))); 

// Página principal
// Utilizar las rutas de usuarios
app.use("/api/usuarios", usuariosRoutes);
// Utilizar las rutas de cita
app.use("/api/citas", citasRoutes);

console.log("Rutas de usuarios cargadas correctamente");

// Ruta principal de prueba
app.get("/", (req, res) => {
    res.json({
        mensaje: "Bienvenido al sistema de la Clínica Dermatológica"
    });
});

// Comprobar conexión con PostgreSQL
// Comprobar el estado del servidor y la base de datos

app.get("/api/estado", async (req, res) => {
    try {
        await pool.query("SELECT NOW()");

        res.json({
            servidor: "Funcionando",
            baseDatos: "Conectada"
        });

    } catch (error) {

        console.error(error.message);

        console.error("Error de conexión:", error.message);


        res.status(500).json({
            servidor: "Funcionando",
            baseDatos: "Error de conexión"
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});