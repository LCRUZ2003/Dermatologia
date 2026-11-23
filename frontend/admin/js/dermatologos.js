
// =====================================
// DERMATÓLOGOS - DERMAVITAL
// Conectado a PostgreSQL
// =====================================

const API = "/api/dermatologos";
const API_ESPECIALIDADES = "/api/especialidades";

let dermatologos = [];
let listaEspecialidades = [];

// =====================================
// ELEMENTOS DEL DOM
// =====================================

const tablaDermatologos = document.getElementById("tablaDermatologos");
const buscarDermatologo = document.getElementById("buscarDermatologo");
const filtroEstado = document.getElementById("filtroEstado");

const modal = document.getElementById("modalDermatologo");
const formulario = document.getElementById("formDermatologo");

const btnNuevo = document.getElementById("btnNuevoDermatologo");
const btnCerrar = document.getElementById("cerrarModal");
const btnCancelar = document.getElementById("cancelarModal");

const selectEspecialidades = document.getElementById("especialidades");

// =====================================
// PETICIONES A LA API
// =====================================

async function realizarPeticion(url, opciones = {}) {
    const token = localStorage.getItem("token");

    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...opciones.headers
        }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "Ocurrió un error en la solicitud.");
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
// CARGAR ESPECIALIDADES
// =====================================

async function cargarEspecialidades() {
    try {
        const datos = await realizarPeticion(API_ESPECIALIDADES);

        listaEspecialidades = Array.isArray(datos)
            ? datos
            : datos.especialidades || [];

        selectEspecialidades.innerHTML = "";

        const disponibles = listaEspecialidades.filter(e => e.estado !== false);

        disponibles.forEach(especialidad => {
            const opcion = document.createElement("option");

            opcion.value = especialidad.id_especialidad;
            opcion.textContent = especialidad.nombre;

            selectEspecialidades.appendChild(opcion);
        });

        if (disponibles.length === 0) {
            selectEspecialidades.innerHTML =
                '<option value="">No hay especialidades disponibles</option>';
        }

    } catch (error) {
        console.error("Error al cargar especialidades:", error);
        alert("No se pudieron cargar las especialidades.");
    }
}

// =====================================
// CARGAR DERMATÓLOGOS
// =====================================

async function cargarDermatologos() {
    try {
        tablaDermatologos.innerHTML = `
            <tr>
                <td colspan="7" class="loading-message">
                    Cargando dermatólogos...
                </td>
            </tr>
        `;

        const datos = await realizarPeticion(API);

        dermatologos = Array.isArray(datos)
            ? datos
            : datos.dermatologos || [];

        actualizarEstadisticas();
        filtrarDermatologos();

    } catch (error) {
        console.error("Error al cargar dermatólogos:", error);

        tablaDermatologos.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No se pudieron cargar los dermatólogos.
                </td>
            </tr>
        `;
    }
}

// =====================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {
    const activos = dermatologos.filter(d => d.estado === true).length;
    const inactivos = dermatologos.filter(d => d.estado === false).length;

    document.getElementById("totalDermatologos").textContent =
        dermatologos.length;

    document.getElementById("dermatologosActivos").textContent =
        activos;

    document.getElementById("dermatologosInactivos").textContent =
        inactivos;
}

// =====================================
// MOSTRAR DERMATÓLOGOS
// =====================================

function mostrarDermatologos(lista = dermatologos) {
    tablaDermatologos.innerHTML = "";

    if (lista.length === 0) {
        tablaDermatologos.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No se encontraron profesionales.
                </td>
            </tr>
        `;

        document.getElementById("contadorDermatologos").textContent =
            "Mostrando 0 profesionales";

        return;
    }

    lista.forEach(doctor => {
        const fila = document.createElement("tr");

        const nombreCompleto =
            `${doctor.nombres} ${doctor.apellidos}`;

        fila.innerHTML = `
            <td>#${doctor.id_dermatologo}</td>

            <td>
                <span class="doctor-name">
                    ${escaparHTML(nombreCompleto)}
                </span>
            </td>

            <td>${escaparHTML(doctor.cedula)}</td>

            <td>
                <span class="doctor-email">
                    ${escaparHTML(doctor.correo)}
                </span>
            </td>

            <td>${escaparHTML(doctor.telefono)}</td>

            <td>
                <span class="doctor-status ${
                    doctor.estado ? "status-active" : "status-inactive"
                }">
                    ${doctor.estado ? "ACTIVO" : "INACTIVO"}
                </span>
            </td>

            <td>
                <div class="doctor-actions">

                    <button class="btn-action btn-edit"
                        title="Editar"
                        data-accion="editar"
                        data-id="${doctor.id_dermatologo}">
                        <i class="fas fa-pen"></i>
                    </button>

                    <button class="btn-action btn-toggle"
                        title="${doctor.estado ? "Desactivar" : "Activar"}"
                        data-accion="estado"
                        data-id="${doctor.id_dermatologo}">
                        <i class="fas ${
                            doctor.estado ? "fa-user-slash" : "fa-user-check"
                        }"></i>
                    </button>

                </div>
            </td>
        `;

        tablaDermatologos.appendChild(fila);
    });

    document.getElementById("contadorDermatologos").textContent =
        `Mostrando ${lista.length} ${
            lista.length === 1 ? "profesional" : "profesionales"
        }`;
}

// =====================================
// BUSCAR Y FILTRAR
// =====================================

function filtrarDermatologos() {
    const texto = buscarDermatologo.value.toLowerCase().trim();
    const estado = filtroEstado.value;

    const resultado = dermatologos.filter(doctor => {
        const nombre =
            `${doctor.nombres} ${doctor.apellidos}`.toLowerCase();

        const coincideTexto =
            nombre.includes(texto) ||
            String(doctor.cedula || "").toLowerCase().includes(texto);

        const coincideEstado =
            estado === "" ||
            (estado === "activo" && doctor.estado === true) ||
            (estado === "inactivo" && doctor.estado === false);

        return coincideTexto && coincideEstado;
    });

    mostrarDermatologos(resultado);
}

// =====================================
// ABRIR MODAL
// =====================================

function abrirModal() {
    formulario.reset();

    document.getElementById("idDermatologo").value = "";

    document.getElementById("tituloModal").textContent =
        "Nuevo dermatólogo";

    Array.from(selectEspecialidades.options).forEach(opcion => {
        opcion.selected = false;
    });

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
// EDITAR DERMATÓLOGO
// =====================================

async function editarDermatologo(id) {
    try {
        const doctor = await realizarPeticion(`${API}/${id}`);

        document.getElementById("idDermatologo").value =
            doctor.id_dermatologo;

        document.getElementById("nombres").value = doctor.nombres;
        document.getElementById("apellidos").value = doctor.apellidos;
        document.getElementById("cedula").value = doctor.cedula;
        document.getElementById("correo").value = doctor.correo;
        document.getElementById("telefono").value = doctor.telefono || "";
        document.getElementById("descripcion").value = doctor.descripcion || "";

        const idsEspecialidades = (doctor.especialidades || [])
            .map(e => String(e.id_especialidad));

        Array.from(selectEspecialidades.options).forEach(opcion => {
            opcion.selected = idsEspecialidades.includes(opcion.value);
        });

        document.getElementById("tituloModal").textContent =
            "Editar dermatólogo";

        modal.classList.add("show");

    } catch (error) {
        console.error("Error al consultar dermatólogo:", error);
        alert(error.message);
    }
}

// =====================================
// GUARDAR DERMATÓLOGO
// =====================================

formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const id = document.getElementById("idDermatologo").value;

    const especialidadesSeleccionadas =
        Array.from(selectEspecialidades.selectedOptions)
            .map(opcion => Number(opcion.value))
            .filter(Number.isInteger);

    if (especialidadesSeleccionadas.length === 0) {
        alert("Debes seleccionar al menos una especialidad.");
        return;
    }

    const datos = {
        nombres: document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        cedula: document.getElementById("cedula").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        especialidades: especialidadesSeleccionadas
    };

    try {
        if (id) {
            await realizarPeticion(`${API}/${id}`, {
                method: "PUT",
                body: JSON.stringify(datos)
            });

            alert("Dermatólogo actualizado correctamente.");

        } else {
            await realizarPeticion(API, {
                method: "POST",
                body: JSON.stringify(datos)
            });

            alert("Dermatólogo registrado correctamente.");
        }

        cerrarModal();
        await cargarDermatologos();

    } catch (error) {
        console.error("Error al guardar dermatólogo:", error);
        alert(error.message);
    }
});

// =====================================
// ACTIVAR O DESACTIVAR
// =====================================

async function cambiarEstadoDermatologo(id) {
    const doctor = dermatologos.find(
        d => Number(d.id_dermatologo) === Number(id)
    );

    if (!doctor) return;

    const nuevoEstado = !doctor.estado;

    const mensaje = nuevoEstado
        ? `¿Deseas activar a ${doctor.nombres} ${doctor.apellidos}?`
        : `¿Deseas desactivar a ${doctor.nombres} ${doctor.apellidos}?`;

    if (!confirm(mensaje)) return;

    try {
        const respuesta = await realizarPeticion(`${API}/${id}/estado`, {
            method: "PATCH"
        });

        alert(respuesta.mensaje);
        await cargarDermatologos();

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert(error.message);
    }
}

// =====================================
// EVENTOS DE LA TABLA
// =====================================

tablaDermatologos.addEventListener("click", function(evento) {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) return;

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "editar") {
        editarDermatologo(id);
    }

    if (accion === "estado") {
        cambiarEstadoDermatologo(id);
    }
});

// =====================================
// EVENTOS DE BOTONES Y FILTROS
// =====================================

btnNuevo.addEventListener("click", abrirModal);

btnCerrar.addEventListener("click", cerrarModal);
btnCancelar.addEventListener("click", cerrarModal);

buscarDermatologo.addEventListener("input", filtrarDermatologos);
filtroEstado.addEventListener("change", filtrarDermatologos);

modal.addEventListener("click", function(evento) {
    if (evento.target === modal) {
        cerrarModal();
    }
});

// =====================================
// INICIALIZAR MÓDULO
// =====================================

async function inicializarModulo() {
    await cargarEspecialidades();
    await cargarDermatologos();
}

inicializarModulo();