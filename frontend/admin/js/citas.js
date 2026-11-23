
// =====================================
// GESTIÓN DE CITAS - DERMAVITAL
// =====================================

// Dirección de la API
const API_CITAS = "/api/admin/citas";

// Obtener token de autenticación
const token = localStorage.getItem("token");

// Almacenar las citas provenientes de PostgreSQL
let citas = [];

// =====================================
// ELEMENTOS DEL DOM
// =====================================

const tablaCitas = document.getElementById("tablaCitas");
const buscarCita = document.getElementById("buscarCita");
const filtroEstado = document.getElementById("filtroEstado");
const filtroFecha = document.getElementById("filtroFecha");

// =====================================
// FUNCIÓN PARA CONSULTAR LA API
// =====================================

async function consultarAPI(url, opciones = {}) {

    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...opciones.headers
        }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No fue posible completar la operación.");
    }

    return datos;
}

// =====================================
// CARGAR CITAS DESDE POSTGRESQL
// =====================================

async function cargarCitas() {

    if (!token) {
        alert("Debes iniciar sesión como administrador.");
        return;
    }

    try {

        tablaCitas.innerHTML = `
            <tr>
                <td colspan="8" class="empty-message">
                    Cargando citas...
                </td>
            </tr>
        `;

        citas = await consultarAPI(API_CITAS);

        actualizarEstadisticas();
        filtrarCitas();

    } catch (error) {

        console.error("Error al cargar citas:", error);

        tablaCitas.innerHTML = `
            <tr>
                <td colspan="8" class="empty-message">
                    ${escaparHTML(error.message)}
                </td>
            </tr>
        `;
    }
}

// =====================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {

    document.getElementById("totalCitas").textContent = citas.length;

    document.getElementById("citasPendientes").textContent =
        citas.filter(cita => cita.estado_cita === "PENDIENTE").length;

    document.getElementById("citasConfirmadas").textContent =
        citas.filter(cita => cita.estado_cita === "CONFIRMADA").length;

    document.getElementById("citasCompletadas").textContent =
        citas.filter(cita => cita.estado_cita === "COMPLETADA").length;
}

// =====================================
// OBTENER CLASE DEL ESTADO
// =====================================

function obtenerClaseEstado(estado) {

    const clases = {
        PENDIENTE: "estado-pendiente",
        CONFIRMADA: "estado-confirmada",
        COMPLETADA: "estado-completada",
        CANCELADA: "estado-cancelada"
    };

    return clases[estado] || "";
}

// =====================================
// FORMATEAR FECHA
// =====================================

function formatearFecha(fecha) {

    if (!fecha) return "No disponible";

    const fechaLimpia = String(fecha).split("T")[0];
    const [anio, mes, dia] = fechaLimpia.split("-");

    return `${dia}/${mes}/${anio}`;
}

// =====================================
// FORMATEAR HORA
// =====================================

function formatearHora(hora) {

    if (!hora) return "No disponible";

    return String(hora).slice(0, 5);
}

// =====================================
// ESCAPAR TEXTO HTML
// =====================================

function escaparHTML(valor) {

    return String(valor ?? "").replace(/[&<>"']/g, caracter => {

        const caracteres = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return caracteres[caracter];
    });
}

// =====================================
// MOSTRAR CITAS EN LA TABLA
// =====================================

function mostrarCitas(lista = citas) {

    tablaCitas.innerHTML = "";

    if (lista.length === 0) {

        tablaCitas.innerHTML = `
            <tr>
                <td colspan="8" class="empty-message">
                    No se encontraron citas.
                </td>
            </tr>
        `;

        document.getElementById("contadorCitas").textContent =
            "Mostrando 0 citas";

        return;
    }

    lista.forEach(cita => {

        const fila = document.createElement("tr");

        const paciente = escaparHTML(cita.nombre_usuario);
        const dermatologo = escaparHTML(
            `${cita.nombre_dermatologo || ""} ${cita.apellido_dermatologo || ""}`.trim()
        );
        const servicio = escaparHTML(cita.nombre_servicio);
        const estado = escaparHTML(cita.estado_cita);

        fila.innerHTML = `
            <td>#${cita.id_cita}</td>

            <td>${paciente}</td>

            <td>${dermatologo}</td>

            <td>${servicio}</td>

            <td>${formatearFecha(cita.fecha_cita)}</td>

            <td>${formatearHora(cita.hora_cita)}</td>

            <td>
                <span class="estado ${obtenerClaseEstado(cita.estado_cita)}">
                    ${estado}
                </span>
            </td>

            <td>
                <div class="acciones">

                    <button class="btn-accion btn-detalle"
                        title="Ver detalles"
                        data-accion="detalle"
                        data-id="${cita.id_cita}">
                        <i class="fas fa-eye"></i>
                    </button>

                    ${
                        cita.estado_cita === "PENDIENTE"
                        ? `
                            <button class="btn-accion btn-confirmar"
                                title="Confirmar cita"
                                data-accion="confirmar"
                                data-id="${cita.id_cita}">
                                <i class="fas fa-check"></i>
                            </button>
                        `
                        : ""
                    }

                </div>
            </td>
        `;

        tablaCitas.appendChild(fila);
    });

    document.getElementById("contadorCitas").textContent =
        `Mostrando ${lista.length} ${lista.length === 1 ? "cita" : "citas"}`;
}

// =====================================
// BUSCAR Y FILTRAR CITAS
// =====================================

function filtrarCitas() {

    const texto = buscarCita.value.toLowerCase().trim();
    const estado = filtroEstado.value;
    const fecha = filtroFecha.value;

    const resultado = citas.filter(cita => {

        const nombrePaciente = (cita.nombre_usuario || "").toLowerCase();

        const nombreDermatologo =
            `${cita.nombre_dermatologo || ""} ${cita.apellido_dermatologo || ""}`.toLowerCase();

        const nombreServicio = (cita.nombre_servicio || "").toLowerCase();

        const correo = (cita.correo_usuario || "").toLowerCase();

        const coincideTexto =
            nombrePaciente.includes(texto) ||
            nombreDermatologo.includes(texto) ||
            nombreServicio.includes(texto) ||
            correo.includes(texto);

        const fechaCita = String(cita.fecha_cita || "").split("T")[0];

        const coincideEstado =
            estado === "" || cita.estado_cita === estado;

        const coincideFecha =
            fecha === "" || fechaCita === fecha;

        return coincideTexto && coincideEstado && coincideFecha;
    });

    mostrarCitas(resultado);
}

// =====================================
// VER DETALLES DE UNA CITA
// =====================================

function verDetalles(id) {

    const cita = citas.find(c => Number(c.id_cita) === id);

    if (!cita) return;

    const paciente = cita.nombre_usuario || "No disponible";

    const dermatologo =
        `${cita.nombre_dermatologo || ""} ${cita.apellido_dermatologo || ""}`.trim();

    alert(
        `DETALLES DE LA CITA\n\n` +
        `Número: #${cita.id_cita}\n` +
        `Paciente: ${paciente}\n` +
        `Correo: ${cita.correo_usuario || "No disponible"}\n` +
        `Dermatólogo: ${dermatologo || "No disponible"}\n` +
        `Servicio: ${cita.nombre_servicio || "No disponible"}\n` +
        `Precio: ${cita.precio_servicio ?? "No disponible"}\n` +
        `Duración: ${cita.duracion_minutos ?? "No disponible"} minutos\n` +
        `Fecha: ${formatearFecha(cita.fecha_cita)}\n` +
        `Hora: ${formatearHora(cita.hora_cita)}\n` +
        `Estado: ${cita.estado_cita}\n` +
        `Motivo: ${cita.motivo_consulta || "No especificado"}`
    );
}

// =====================================
// CONFIRMAR CITA
// =====================================

async function confirmarCita(id) {

    const cita = citas.find(c => Number(c.id_cita) === id);

    if (!cita || cita.estado_cita !== "PENDIENTE") return;

    const confirmar = window.confirm(
        `¿Deseas confirmar la cita de ${cita.nombre_usuario}?`
    );

    if (!confirmar) return;

    try {

        const resultado = await consultarAPI(
            `${API_CITAS}/${id}/confirmar`,
            {
                method: "PATCH"
            }
        );

        alert(resultado.mensaje || "Cita confirmada correctamente.");

        // Volver a consultar los datos actualizados
        await cargarCitas();

    } catch (error) {

        console.error("Error al confirmar cita:", error);

        alert(error.message);
    }
}

// =====================================
// EVENTOS DE LOS FILTROS
// =====================================

buscarCita.addEventListener("input", filtrarCitas);
filtroEstado.addEventListener("change", filtrarCitas);
filtroFecha.addEventListener("change", filtrarCitas);

// =====================================
// EVENTOS DE LAS ACCIONES
// =====================================

tablaCitas.addEventListener("click", function (evento) {

    const boton = evento.target.closest("button[data-accion]");

    if (!boton) return;

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "detalle") {
        verDetalles(id);
    }

    if (accion === "confirmar") {
        confirmarCita(id);
    }
});

// =====================================
// INICIALIZAR PÁGINA
// =====================================

cargarCitas();