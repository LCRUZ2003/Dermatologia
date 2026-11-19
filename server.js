
// Cargar las variables de entorno
require("dotenv").config();

// Importar Express
const express = require("express");

// Importar la conexión con PostgreSQL
const pool = require("./config/db");

// Crear la aplicación
const app = express();

// Permitir recibir datos en formato JSON
app.use(express.json());
