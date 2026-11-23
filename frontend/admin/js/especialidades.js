
// =====================================
// ESPECIALIDADES - DERMAVITAL
// =====================================

// Datos temporales de demostración
let especialidades = [
    {
        id: 1,
        nombre: "Dermatología General",
        descripcion: "Diagnóstico y tratamiento de enfermedades de la piel, cabello y uñas.",
        estado: true
    },
    {
        id: 2,
        nombre: "Dermatología Estética",
        descripcion: "Tratamientos enfocados en mejorar la apariencia y salud de la piel.",
        estado: true
    },
    {
        id: 3,
        nombre: "Dermatología Pediátrica",
        descripcion: "Atención y tratamiento de afecciones dermatológicas en niños.",
        estado: true
    },
    {
        id: 4,
        nombre: "Dermatología Clínica",
        descripcion: "Evaluación y manejo de enfermedades dermatológicas complejas.",
        estado: false
    }
];

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
// ACTUALIZAR ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {

    const activas = especialidades.filter(e => e.estado).length;
    const inactivas = especialidades.filter(e => !e.estado).length;

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
            <td>#${especialidad.id}</td>

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
                        data-id="${especialidad.id}">
                        <i class="fas fa-pen"></i>
                    </button>

                    <button class="btn-action btn-toggle"
                        title="${especialidad.estado ? "Desactivar" : "Activar"}"
                        data-accion="estado"
                        data-id="${especialidad.id}">
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
            (estado === "activo" && especialidad.estado) ||
            (estado === "inactivo" && !especialidad.estado);

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

    const especialidad = especialidades.find(e => e.id === id);

    if (!especialidad) return;

    document.getElementById("idEspecialidad").value =
        especialidad.id;

    document.getElementById("nombreEspecialidad").value =
        especialidad.nombre;

    document.getElementById("descripcionEspecialidad").value =
        especialidad.descripcion;

    document.getElementById("tituloModal").textContent =
        "Editar especialidad";

    modal.classList.add("show");
}

// =====================================
// GUARDAR ESPECIALIDAD
// =====================================

formulario.addEventListener("submit", function(evento) {

    evento.preventDefault();

    const id = document.getElementById("idEspecialidad").value;

    const nombre = document.getElementById("nombreEspecialidad")
        .value.trim();

    const descripcion = document.getElementById("descripcionEspecialidad")
        .value.trim();

    // Evitar nombres duplicados
    const nombreExiste = especialidades.some(especialidad =>
        especialidad.nombre.toLowerCase() === nombre.toLowerCase() &&
        especialidad.id !== Number(id)
    );

    if (nombreExiste) {
        alert("Ya existe una especialidad con ese nombre.");
        return;
    }

    // Editar especialidad
    if (id) {

        const indice = especialidades.findIndex(
            especialidad => especialidad.id === Number(id)
        );

        if (indice === -1) return;

        especialidades[indice] = {
            ...especialidades[indice],
            nombre,
            descripcion
        };

        alert("Especialidad actualizada correctamente (modo demostración).");

    } else {

        // Registrar nueva especialidad
        const nuevaEspecialidad = {
            id: especialidades.length
                ? Math.max(...especialidades.map(e => e.id)) + 1
                : 1,
            nombre,
            descripcion,
            estado: true
        };

        especialidades.push(nuevaEspecialidad);

        alert("Especialidad registrada correctamente (modo demostración).");
    }

    cerrarModal();
    actualizarEstadisticas();
    filtrarEspecialidades();
});

// =====================================
// ACTIVAR O DESACTIVAR
// =====================================

function cambiarEstadoEspecialidad(id) {

    const especialidad = especialidades.find(e => e.id === id);

    if (!especialidad) return;

    const nuevoEstado = !especialidad.estado;

    const mensaje = nuevoEstado
        ? `¿Deseas activar "${especialidad.nombre}"?`
        : `¿Deseas desactivar "${especialidad.nombre}"?`;

    if (!confirm(mensaje)) return;

    especialidad.estado = nuevoEstado;

    actualizarEstadisticas();
    filtrarEspecialidades();

    alert(
        nuevoEstado
            ? "Especialidad activada correctamente (modo demostración)."
            : "Especialidad desactivada correctamente (modo demostración)."
    );
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

actualizarEstadisticas();
mostrarEspecialidades();
