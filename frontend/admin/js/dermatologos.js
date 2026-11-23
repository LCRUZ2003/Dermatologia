
// =====================================
// DERMATÓLOGOS - DERMAVITAL
// =====================================

// Datos temporales de demostración
let dermatologos = [
    {
        id: 1,
        nombres: "Laura",
        apellidos: "Rodríguez",
        cedula: "047-1234567-8",
        correo: "laura.rodriguez@gmail.com",
        telefono: "809-555-1234",
        descripcion: "Especialista en dermatología general.",
        estado: true
    },
    {
        id: 2,
        nombres: "María",
        apellidos: "Fernández",
        cedula: "047-2345678-9",
        correo: "maria.fernandez@gmail.com",
        telefono: "829-555-2345",
        descripcion: "Especialista en dermatología estética.",
        estado: true
    },
    {
        id: 3,
        nombres: "Carlos",
        apellidos: "Méndez",
        cedula: "047-3456789-0",
        correo: "carlos.mendez@gmail.com",
        telefono: "849-555-3456",
        descripcion: "Especialista en tratamientos dermatológicos.",
        estado: false
    }
];

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

// =====================================
// ESCAPAR TEXTO PARA MOSTRARLO EN HTML
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

    const activos = dermatologos.filter(d => d.estado).length;
    const inactivos = dermatologos.filter(d => !d.estado).length;

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
            <td>#${doctor.id}</td>

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
                        data-id="${doctor.id}">
                        <i class="fas fa-pen"></i>
                    </button>

                    <button class="btn-action btn-toggle"
                        title="${doctor.estado ? "Desactivar" : "Activar"}"
                        data-accion="estado"
                        data-id="${doctor.id}">
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
            doctor.cedula.toLowerCase().includes(texto);

        const coincideEstado =
            estado === "" ||
            (estado === "activo" && doctor.estado) ||
            (estado === "inactivo" && !doctor.estado);

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

function editarDermatologo(id) {

    const doctor = dermatologos.find(d => d.id === id);

    if (!doctor) return;

    document.getElementById("idDermatologo").value = doctor.id;
    document.getElementById("nombres").value = doctor.nombres;
    document.getElementById("apellidos").value = doctor.apellidos;
    document.getElementById("cedula").value = doctor.cedula;
    document.getElementById("correo").value = doctor.correo;
    document.getElementById("telefono").value = doctor.telefono;
    document.getElementById("descripcion").value = doctor.descripcion;

    document.getElementById("tituloModal").textContent =
        "Editar dermatólogo";

    modal.classList.add("show");
}

// =====================================
// GUARDAR DERMATÓLOGO
// =====================================

formulario.addEventListener("submit", function(evento) {

    evento.preventDefault();

    const id = document.getElementById("idDermatologo").value;

    const datos = {
        nombres: document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        cedula: document.getElementById("cedula").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim()
    };

    // Validar cédula duplicada
    const cedulaExiste = dermatologos.some(doctor =>
        doctor.cedula === datos.cedula &&
        doctor.id !== Number(id)
    );

    if (cedulaExiste) {
        alert("Ya existe un dermatólogo registrado con esa cédula.");
        return;
    }

    // Editar profesional existente
    if (id) {

        const indice = dermatologos.findIndex(
            doctor => doctor.id === Number(id)
        );

        if (indice === -1) return;

        dermatologos[indice] = {
            ...dermatologos[indice],
            ...datos
        };

        alert("Información actualizada correctamente (modo demostración).");

    } else {

        // Registrar nuevo profesional
        const nuevoDermatologo = {
            id: dermatologos.length
                ? Math.max(...dermatologos.map(d => d.id)) + 1
                : 1,
            ...datos,
            estado: true
        };

        dermatologos.push(nuevoDermatologo);

        alert("Dermatólogo registrado correctamente (modo demostración).");
    }

    cerrarModal();
    actualizarEstadisticas();
    filtrarDermatologos();
});

// =====================================
// ACTIVAR O DESACTIVAR
// =====================================

function cambiarEstadoDermatologo(id) {

    const doctor = dermatologos.find(d => d.id === id);

    if (!doctor) return;

    const nuevoEstado = !doctor.estado;

    const mensaje = nuevoEstado
        ? `¿Deseas activar a ${doctor.nombres} ${doctor.apellidos}?`
        : `¿Deseas desactivar a ${doctor.nombres} ${doctor.apellidos}?`;

    if (!confirm(mensaje)) return;

    doctor.estado = nuevoEstado;

    actualizarEstadisticas();
    filtrarDermatologos();

    alert(
        nuevoEstado
            ? "Dermatólogo activado correctamente (modo demostración)."
            : "Dermatólogo desactivado correctamente (modo demostración)."
    );
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
// EVENTOS DE LOS BOTONES Y FILTROS
// =====================================

btnNuevo.addEventListener("click", abrirModal);

btnCerrar.addEventListener("click", cerrarModal);
btnCancelar.addEventListener("click", cerrarModal);

buscarDermatologo.addEventListener("input", filtrarDermatologos);
filtroEstado.addEventListener("change", filtrarDermatologos);

// Cerrar modal al hacer clic fuera de él
modal.addEventListener("click", function(evento) {
    if (evento.target === modal) {
        cerrarModal();
    }
});

// =====================================
// INICIALIZAR MÓDULO
// =====================================

actualizarEstadisticas();
mostrarDermatologos();
