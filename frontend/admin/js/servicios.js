
// =====================================
// SERVICIOS - DERMAVITAL
// Conectado a PostgreSQL
// =====================================

const API = "/api/servicios";

const tablaServicios = document.getElementById("tablaServicios");
const buscarServicio = document.getElementById("buscarServicio");
const filtroEstado = document.getElementById("filtroEstado");
const modal = document.getElementById("modalServicio");
const formulario = document.getElementById("formServicio");

// =====================================
// CONFIGURACIÓN DE PETICIONES
// =====================================

function obtenerHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
    };
}

// =====================================
// ESCAPAR TEXTO HTML
// =====================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[c]);
}

// =====================================
// FORMATO DE PRECIO
// =====================================

function formatoPrecio(precio) {
    return Number(precio).toLocaleString("es-DO", {
        style: "currency",
        currency: "DOP"
    });
}

// =====================================
// CARGAR SERVICIOS DESDE LA BD
// =====================================

let servicios = [];

async function cargarServicios() {
    try {
        const respuesta = await fetch(API, {
            headers: obtenerHeaders()
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudieron consultar los servicios.");
        }

        servicios = Array.isArray(datos) ? datos : datos.servicios || [];

        actualizarEstadisticas();
        filtrarServicios();

    } catch (error) {
        console.error("Error al cargar servicios:", error);
        alert(error.message || "Error al conectar con el servidor.");
    }
}

// =====================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {
    document.getElementById("totalServicios").textContent =
        servicios.length;

    document.getElementById("serviciosActivos").textContent =
        servicios.filter(s => s.estado === true).length;

    document.getElementById("serviciosInactivos").textContent =
        servicios.filter(s => s.estado === false).length;
}

// =====================================
// MOSTRAR SERVICIOS
// =====================================

function mostrarServicios(lista = servicios) {
    tablaServicios.innerHTML = "";

    if (!lista.length) {
        tablaServicios.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No se encontraron servicios.
                </td>
            </tr>
        `;
    } else {
        lista.forEach(servicio => {
            const id = servicio.id_servicio;
            const activo = servicio.estado === true;

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>#${escaparHTML(id)}</td>

                <td>
                    <span class="service-name">
                        ${escaparHTML(servicio.nombre)}
                    </span>
                </td>

                <td>
                    <span class="service-description">
                        ${escaparHTML(servicio.descripcion || "Sin descripción")}
                    </span>
                </td>

                <td>${formatoPrecio(servicio.precio)}</td>

                <td>${escaparHTML(servicio.duracion_minutos)} min</td>

                <td>
                    <span class="service-status ${activo ? "status-active" : "status-inactive"}">
                        ${activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                </td>

                <td>
                    <div class="service-actions">

                        <button class="btn-action btn-edit"
                            title="Editar"
                            data-accion="editar"
                            data-id="${escaparHTML(id)}">
                            <i class="fas fa-pen"></i>
                        </button>

                        <button class="btn-action btn-toggle"
                            title="${activo ? "Desactivar" : "Activar"}"
                            data-accion="estado"
                            data-id="${escaparHTML(id)}">
                            <i class="fas ${activo ? "fa-ban" : "fa-check"}"></i>
                        </button>

                    </div>
                </td>
            `;

            tablaServicios.appendChild(fila);
        });
    }

    document.getElementById("contadorServicios").textContent =
        `Mostrando ${lista.length} ${
            lista.length === 1 ? "servicio" : "servicios"
        }`;
}

// =====================================
// BUSCAR Y FILTRAR
// =====================================

function filtrarServicios() {
    const texto = buscarServicio.value.toLowerCase().trim();
    const estado = filtroEstado.value;

    const resultado = servicios.filter(servicio => {
        const coincideTexto =
            servicio.nombre.toLowerCase().includes(texto) ||
            (servicio.descripcion || "").toLowerCase().includes(texto);

        const coincideEstado =
            estado === "" ||
            (estado === "activo" && servicio.estado === true) ||
            (estado === "inactivo" && servicio.estado === false);

        return coincideTexto && coincideEstado;
    });

    mostrarServicios(resultado);
}

// =====================================
// ABRIR MODAL
// =====================================

function abrirModal() {
    formulario.reset();

    document.getElementById("idServicio").value = "";

    document.getElementById("tituloModal").textContent =
        "Nuevo servicio";

    modal.classList.add("show");
}

// =====================================
// CERRAR MODAL
// =====================================

function cerrarModal() {
    modal.classList.remove("show");
    formulario.reset();
}

// =====================================
// EDITAR SERVICIO
// =====================================

async function editarServicio(id) {
    try {
        const respuesta = await fetch(`${API}/${id}`, {
            headers: obtenerHeaders()
        });

        const servicio = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(servicio.mensaje || "No se pudo consultar el servicio.");
        }

        document.getElementById("idServicio").value =
            servicio.id_servicio;

        document.getElementById("nombreServicio").value =
            servicio.nombre;

        document.getElementById("descripcionServicio").value =
            servicio.descripcion || "";

        document.getElementById("precioServicio").value =
            servicio.precio;

        document.getElementById("duracionServicio").value =
            servicio.duracion_minutos;

        document.getElementById("tituloModal").textContent =
            "Editar servicio";

        modal.classList.add("show");

    } catch (error) {
        console.error("Error al consultar servicio:", error);
        alert(error.message);
    }
}

// =====================================
// REGISTRAR O ACTUALIZAR SERVICIO
// =====================================

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const id = document.getElementById("idServicio").value;

    const datos = {
        nombre: document.getElementById("nombreServicio").value.trim(),
        descripcion: document.getElementById("descripcionServicio").value.trim(),
        precio: Number(document.getElementById("precioServicio").value),
        duracion_minutos: Number(document.getElementById("duracionServicio").value)
    };

    if (
        !datos.nombre ||
        !Number.isFinite(datos.precio) ||
        datos.precio < 0 ||
        !Number.isInteger(datos.duracion_minutos) ||
        datos.duracion_minutos <= 0
    ) {
        alert("Verifica los datos del servicio. El precio no puede ser negativo y la duración debe ser un número entero positivo.");
        return;
    }

    try {
        const respuesta = await fetch(
            id ? `${API}/${id}` : API,
            {
                method: id ? "PUT" : "POST",
                headers: obtenerHeaders(),
                body: JSON.stringify(datos)
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo guardar el servicio.");
        }

        alert(resultado.mensaje);

        cerrarModal();
        await cargarServicios();

    } catch (error) {
        console.error("Error al guardar servicio:", error);
        alert(error.message);
    }
});

// =====================================
// ACTIVAR O DESACTIVAR SERVICIO
// =====================================

async function cambiarEstadoServicio(id) {
    const servicio = servicios.find(
        s => Number(s.id_servicio) === Number(id)
    );

    if (!servicio) return;

    const activo = servicio.estado === true;

    const accion = activo ? "desactivar" : "activar";

    if (!confirm(`¿Deseas ${accion} "${servicio.nombre}"?`)) {
        return;
    }

    try {
        const respuesta = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: obtenerHeaders()
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo cambiar el estado del servicio.");
        }

        alert(resultado.mensaje);

        await cargarServicios();

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert(error.message);
    }
}

// =====================================
// EVENTOS DE LA TABLA
// =====================================

tablaServicios.addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.dataset.accion === "editar") {
        editarServicio(id);
    }

    if (boton.dataset.accion === "estado") {
        cambiarEstadoServicio(id);
    }
});

// =====================================
// EVENTOS DE BOTONES Y FILTROS
// =====================================

document.getElementById("btnNuevoServicio")
    .addEventListener("click", abrirModal);

document.getElementById("cerrarModal")
    .addEventListener("click", cerrarModal);

document.getElementById("cancelarModal")
    .addEventListener("click", cerrarModal);

buscarServicio.addEventListener("input", filtrarServicios);

filtroEstado.addEventListener("change", filtrarServicios);

modal.addEventListener("click", evento => {
    if (evento.target === modal) {
        cerrarModal();
    }
});

// =====================================
// INICIALIZAR MÓDULO
// =====================================

cargarServicios();
