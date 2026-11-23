
// =====================================
// ESPECIALIDADES - DERMAVITAL
// =====================================

const API = "/api/especialidades";

let especialidades = [];

// =====================================
// ELEMENTOS DEL DOM
// =====================================

const tablaEspecialidades = document.getElementById("tablaEspecialidades");
const buscarEspecialidad = document.getElementById("buscarEspecialidad");
const filtroEstado = document.getElementById("filtroEstado");

const modal = document.getElementById("modalEspecialidad");
const formulario = document.getElementById("formEspecialidad");

const btnNueva = document.getElementById("btnNuevaEspecialidad");
const btnCerrar = document.getElementById("cerrarModal");
const btnCancelar = document.getElementById("cancelarModal");

// =====================================
// CONFIGURACIÓN DE PETICIONES
// =====================================

function obtenerToken() {
    return localStorage.getItem("token");
}

async function realizarPeticion(url, opciones = {}) {
    const token = obtenerToken();

    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            ...(opciones.headers || {}),
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "Ocurrió un error al procesar la solicitud.");
    }

    return datos;
}

// =====================================
// ESCAPAR TEXTO PARA MOSTRAR EN HTML
// =====================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caracter]);
}

// =====================================
// CONSULTAR ESPECIALIDADES
// =====================================

async function cargarEspecialidades() {
    try {
        const datos = await realizarPeticion(API);

        especialidades = Array.isArray(datos)
            ? datos
            : datos.especialidades || [];

        actualizarEstadisticas();
        filtrarEspecialidades();

    } catch (error) {
        console.error("Error al cargar especialidades:", error);
        alert(error.message);
    }
}

// =====================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {
    const activas = especialidades.filter(e => e.estado === true).length;
    const inactivas = especialidades.filter(e => e.estado === false).length;

    document.getElementById("totalEspecialidades").textContent =
        especialidades.length;

    document.getElementById("especialidadesActivas").textContent =
        activas;

    document.getElementById("especialidadesInactivas").textContent =
        inactivas;
}

// =====================================
// MOSTRAR ESPECIALIDADES
// =====================================

function mostrarEspecialidades(lista = especialidades) {
    tablaEspecialidades.innerHTML = "";

    if (lista.length === 0) {
        tablaEspecialidades.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No se encontraron especialidades.
                </td>
            </tr>
        `;

        document.getElementById("contadorEspecialidades").textContent =
            "Mostrando 0 especialidades";

        return;
    }

    lista.forEach(especialidad => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>#${especialidad.id_especialidad}</td>

            <td>
                <span class="specialty-name">
                    ${escaparHTML(especialidad.nombre)}
                </span>
            </td>

            <td>
                <span class="specialty-description">
                    ${escaparHTML(especialidad.descripcion || "Sin descripción")}
                </span>
            </td>

            <td>
                <span class="specialty-status ${
                    especialidad.estado ? "status-active" : "status-inactive"
                }">
                    ${especialidad.estado ? "ACTIVA" : "INACTIVA"}
                </span>
            </td>

            <td>
                <div class="specialty-actions">

                    <button class="btn-action btn-edit"
                        title="Editar"
                        data-accion="editar"
                        data-id="${especialidad.id_especialidad}">
                        <i class="fas fa-pen"></i>
                    </button>

                    <button class="btn-action btn-toggle"
                        title="${especialidad.estado ? "Desactivar" : "Activar"}"
                        data-accion="estado"
                        data-id="${especialidad.id_especialidad}">
                        <i class="fas ${
                            especialidad.estado ? "fa-ban" : "fa-check"
                        }"></i>
                    </button>

                </div>
            </td>
        `;

        tablaEspecialidades.appendChild(fila);
    });

    document.getElementById("contadorEspecialidades").textContent =
        `Mostrando ${lista.length} ${
            lista.length === 1 ? "especialidad" : "especialidades"
        }`;
}

// =====================================
// BUSCAR Y FILTRAR
// =====================================

function filtrarEspecialidades() {
    const texto = buscarEspecialidad.value.toLowerCase().trim();
    const estado = filtroEstado.value;

    const resultado = especialidades.filter(especialidad => {
        const coincideTexto =
            especialidad.nombre.toLowerCase().includes(texto) ||
            (especialidad.descripcion || "").toLowerCase().includes(texto);

        const coincideEstado =
            estado === "" ||
            (estado === "activo" && especialidad.estado === true) ||
            (estado === "inactivo" && especialidad.estado === false);

        return coincideTexto && coincideEstado;
    });

    mostrarEspecialidades(resultado);
}

// =====================================
// ABRIR MODAL
// =====================================

function abrirModal() {
    formulario.reset();

    document.getElementById("idEspecialidad").value = "";

    document.getElementById("tituloModal").textContent =
        "Nueva especialidad";

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
// EDITAR ESPECIALIDAD
// =====================================

function editarEspecialidad(id) {
    const especialidad = especialidades.find(
        e => e.id_especialidad === id
    );

    if (!especialidad) return;

    document.getElementById("idEspecialidad").value =
        especialidad.id_especialidad;

    document.getElementById("nombreEspecialidad").value =
        especialidad.nombre;

    document.getElementById("descripcionEspecialidad").value =
        especialidad.descripcion || "";

    document.getElementById("tituloModal").textContent =
        "Editar especialidad";

    modal.classList.add("show");
}

// =====================================
// GUARDAR ESPECIALIDAD
// =====================================

formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const id = document.getElementById("idEspecialidad").value;

    const nombre = document.getElementById("nombreEspecialidad")
        .value.trim();

    const descripcion = document.getElementById("descripcionEspecialidad")
        .value.trim();

    if (!nombre) {
        alert("Debes escribir el nombre de la especialidad.");
        return;
    }

    const nombreExiste = especialidades.some(especialidad =>
        especialidad.nombre.toLowerCase() === nombre.toLowerCase() &&
        especialidad.id_especialidad !== Number(id)
    );

    if (nombreExiste) {
        alert("Ya existe una especialidad con ese nombre.");
        return;
    }

    const datos = {
        nombre,
        descripcion
    };

    try {
        if (id) {
            await realizarPeticion(`${API}/${id}`, {
                method: "PUT",
                body: JSON.stringify(datos)
            });

            alert("Especialidad actualizada correctamente.");

        } else {
            await realizarPeticion(API, {
                method: "POST",
                body: JSON.stringify(datos)
            });

            alert("Especialidad registrada correctamente.");
        }

        cerrarModal();
        await cargarEspecialidades();

    } catch (error) {
        console.error("Error al guardar especialidad:", error);
        alert(error.message);
    }
});

// =====================================
// ACTIVAR O DESACTIVAR ESPECIALIDAD
// =====================================

async function cambiarEstadoEspecialidad(id) {
    const especialidad = especialidades.find(
        e => e.id_especialidad === id
    );

    if (!especialidad) return;

    const nuevoEstado = !especialidad.estado;

    const mensaje = nuevoEstado
        ? `¿Deseas activar "${especialidad.nombre}"?`
        : `¿Deseas desactivar "${especialidad.nombre}"?`;

    if (!confirm(mensaje)) return;

    try {
        const datos = await realizarPeticion(`${API}/${id}/estado`, {
            method: "PATCH"
        });

        alert(datos.mensaje || "Estado actualizado correctamente.");

        await cargarEspecialidades();

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert(error.message);
    }
}

// =====================================
// EVENTOS DE LA TABLA
// =====================================

tablaEspecialidades.addEventListener("click", function(evento) {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) return;

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "editar") {
        editarEspecialidad(id);
    }

    if (accion === "estado") {
        cambiarEstadoEspecialidad(id);
    }
});

// =====================================
// EVENTOS DE BOTONES Y FILTROS
// =====================================

btnNueva.addEventListener("click", abrirModal);

btnCerrar.addEventListener("click", cerrarModal);
btnCancelar.addEventListener("click", cerrarModal);

buscarEspecialidad.addEventListener("input", filtrarEspecialidades);
filtroEstado.addEventListener("change", filtrarEspecialidades);

// Cerrar modal al hacer clic fuera
modal.addEventListener("click", function(evento) {
    if (evento.target === modal) {
        cerrarModal();
    }
});

// =====================================
// INICIALIZAR MÓDULO
// =====================================

cargarEspecialidades();
