
// =====================================
// HORARIOS - DERMAVITAL
// Conectado a PostgreSQL
// =====================================

const API = "/api/horarios";
const API_DERMATOLOGOS = "/api/dermatologos";

let horarios = [];
let dermatologosDisponibles = [];

const tablaHorarios = document.getElementById("tablaHorarios");
const buscarHorario = document.getElementById("buscarHorario");
const filtroDia = document.getElementById("filtroDia");
const filtroEstado = document.getElementById("filtroEstado");
const modal = document.getElementById("modalHorario");
const formulario = document.getElementById("formHorario");

// =====================================
// HEADERS
// =====================================

function obtenerHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
    };
}

// =====================================
// ESCAPAR HTML
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
// FORMATO DE HORA
// =====================================

function formatoHora(hora) {
    return String(hora || "").slice(0, 5);
}

// =====================================
// NORMALIZAR DÍAS
// =====================================

function normalizarDia(dia) {
    return dia.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// =====================================
// CARGAR DERMATÓLOGOS
// =====================================

async function cargarDermatologos() {
    const select = document.getElementById("dermatologoHorario");

    try {
        const respuesta = await fetch(API_DERMATOLOGOS, {
            headers: obtenerHeaders()
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudieron consultar los dermatólogos.");
        }

        const lista = Array.isArray(datos)
            ? datos
            : datos.dermatologos || [];

        dermatologosDisponibles = lista.filter(d => d.estado === true);

        select.innerHTML = `
            <option value="">Selecciona un dermatólogo</option>
            ${dermatologosDisponibles.map(d => `
                <option value="${d.id_dermatologo}">
                    ${escaparHTML(d.nombres)} ${escaparHTML(d.apellidos)}
                </option>
            `).join("")}
        `;

    } catch (error) {
        console.error("Error al cargar dermatólogos:", error);
        select.innerHTML = `
            <option value="">Error al cargar dermatólogos</option>
        `;
        alert(error.message);
    }
}

// =====================================
// CARGAR HORARIOS
// =====================================

async function cargarHorarios() {
    try {
        const respuesta = await fetch(API, {
            headers: obtenerHeaders()
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudieron consultar los horarios.");
        }

        horarios = Array.isArray(datos) ? datos : datos.horarios || [];

        actualizarEstadisticas();
        filtrarHorarios();

    } catch (error) {
        console.error("Error al cargar horarios:", error);
        alert(error.message);
    }
}

// =====================================
// ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {
    document.getElementById("totalHorarios").textContent =
        horarios.length;

    document.getElementById("horariosActivos").textContent =
        horarios.filter(h => h.estado === true).length;

    document.getElementById("horariosInactivos").textContent =
        horarios.filter(h => h.estado === false).length;
}

// =====================================
// MOSTRAR HORARIOS
// =====================================

function mostrarHorarios(lista = horarios) {
    tablaHorarios.innerHTML = "";

    if (!lista.length) {
        tablaHorarios.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No se encontraron horarios.
                </td>
            </tr>
        `;
    } else {
        lista.forEach(horario => {
            const activo = horario.estado === true;
            const nombre = `${horario.nombres} ${horario.apellidos}`;

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>#${escaparHTML(horario.id_horario)}</td>

                <td>${escaparHTML(nombre)}</td>

                <td>${escaparHTML(horario.dia_semana)}</td>

                <td>${escaparHTML(formatoHora(horario.hora_inicio))}</td>

                <td>${escaparHTML(formatoHora(horario.hora_fin))}</td>

                <td>
                    <span class="schedule-status ${activo ? "status-active" : "status-inactive"}">
                        ${activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                </td>

                <td>
                    <div class="schedule-actions">

                        <button class="btn-action btn-edit"
                            title="Editar"
                            data-accion="editar"
                            data-id="${escaparHTML(horario.id_horario)}">
                            <i class="fas fa-pen"></i>
                        </button>

                        <button class="btn-action btn-toggle"
                            title="${activo ? "Desactivar" : "Activar"}"
                            data-accion="estado"
                            data-id="${escaparHTML(horario.id_horario)}">
                            <i class="fas ${activo ? "fa-ban" : "fa-check"}"></i>
                        </button>

                    </div>
                </td>
            `;

            tablaHorarios.appendChild(fila);
        });
    }

    document.getElementById("contadorHorarios").textContent =
        `Mostrando ${lista.length} ${
            lista.length === 1 ? "horario" : "horarios"
        }`;
}

// =====================================
// BUSCAR Y FILTRAR
// =====================================

function filtrarHorarios() {
    const texto = buscarHorario.value.toLowerCase().trim();
    const dia = normalizarDia(filtroDia.value);
    const estado = filtroEstado.value;

    const resultado = horarios.filter(h => {
        const nombre = `${h.nombres} ${h.apellidos}`.toLowerCase();

        const coincideNombre = nombre.includes(texto);

        const coincideDia =
            dia === "" || normalizarDia(h.dia_semana) === dia;

        const coincideEstado =
            estado === "" ||
            (estado === "activo" && h.estado === true) ||
            (estado === "inactivo" && h.estado === false);

        return coincideNombre && coincideDia && coincideEstado;
    });

    mostrarHorarios(resultado);
}

// =====================================
// ABRIR MODAL
// =====================================

function abrirModal() {
    formulario.reset();

    document.getElementById("idHorario").value = "";

    document.getElementById("tituloModal").textContent =
        "Nuevo horario";

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
// EDITAR HORARIO
// =====================================

async function editarHorario(id) {
    try {
        const respuesta = await fetch(`${API}`, {
            headers: obtenerHeaders()
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudieron consultar los horarios.");
        }

        const lista = Array.isArray(datos) ? datos : datos.horarios || [];

        const horario = lista.find(h =>
            Number(h.id_horario) === Number(id)
        );

        if (!horario) {
            throw new Error("No se encontró el horario seleccionado.");
        }

        document.getElementById("idHorario").value =
            horario.id_horario;

        document.getElementById("dermatologoHorario").value =
            horario.id_dermatologo;

        document.getElementById("diaSemana").value =
            horario.dia_semana;

        document.getElementById("horaInicio").value =
            formatoHora(horario.hora_inicio);

        document.getElementById("horaFin").value =
            formatoHora(horario.hora_fin);

        document.getElementById("tituloModal").textContent =
            "Editar horario";

        modal.classList.add("show");

    } catch (error) {
        console.error("Error al editar horario:", error);
        alert(error.message);
    }
}

// =====================================
// REGISTRAR O ACTUALIZAR
// =====================================

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const id = document.getElementById("idHorario").value;

    const datos = {
        id_dermatologo: Number(
            document.getElementById("dermatologoHorario").value
        ),
        dia_semana: normalizarDia(
            document.getElementById("diaSemana").value
        ),
        hora_inicio: document.getElementById("horaInicio").value,
        hora_fin: document.getElementById("horaFin").value
    };

    if (!datos.id_dermatologo || !datos.dia_semana ||
        !datos.hora_inicio || !datos.hora_fin) {
        alert("Completa todos los campos del horario.");
        return;
    }

    if (datos.hora_inicio >= datos.hora_fin) {
        alert("La hora de finalización debe ser posterior a la hora de inicio.");
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
            throw new Error(resultado.mensaje || "No se pudo guardar el horario.");
        }

        alert(resultado.mensaje);

        cerrarModal();
        await cargarHorarios();

    } catch (error) {
        console.error("Error al guardar horario:", error);
        alert(error.message);
    }
});

// =====================================
// ACTIVAR O DESACTIVAR
// =====================================

async function cambiarEstadoHorario(id) {
    const horario = horarios.find(h =>
        Number(h.id_horario) === Number(id)
    );

    if (!horario) return;

    const activo = horario.estado === true;

    const accion = activo ? "desactivar" : "activar";

    if (!confirm(`¿Deseas ${accion} este horario?`)) return;

    try {
        const respuesta = await fetch(`${API}/${id}/estado`, {
            method: "PATCH",
            headers: obtenerHeaders()
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo cambiar el estado.");
        }

        alert(resultado.mensaje);

        await cargarHorarios();

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert(error.message);
    }
}

// =====================================
// EVENTOS DE LA TABLA
// =====================================

tablaHorarios.addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.dataset.accion === "editar") {
        editarHorario(id);
    }

    if (boton.dataset.accion === "estado") {
        cambiarEstadoHorario(id);
    }
});

// =====================================
// EVENTOS GENERALES
// =====================================

document.getElementById("btnNuevoHorario")
    .addEventListener("click", abrirModal);

document.getElementById("cerrarModal")
    .addEventListener("click", cerrarModal);

document.getElementById("cancelarModal")
    .addEventListener("click", cerrarModal);

buscarHorario.addEventListener("input", filtrarHorarios);

filtroDia.addEventListener("change", filtrarHorarios);

filtroEstado.addEventListener("change", filtrarHorarios);

modal.addEventListener("click", evento => {
    if (evento.target === modal) {
        cerrarModal();
    }
});

// =====================================
// INICIALIZAR
// =====================================

async function inicializarHorarios() {
    await cargarDermatologos();
    await cargarHorarios();
}

inicializarHorarios();