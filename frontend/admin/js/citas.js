
// =====================================
// GESTIÓN DE CITAS - DERMAVITAL
// =====================================

// Datos temporales para diseñar y probar la interfaz.
// Posteriormente serán sustituidos por los datos de PostgreSQL.

let citas = [
    {
        id: 1,
        paciente: "Ana Martínez",
        correo: "ana@gmail.com",
        dermatologo: "Laura Rodríguez",
        servicio: "Dermatología General",
        fecha: "2026-11-23",
        hora: "09:00",
        estado: "PENDIENTE",
        motivo: "Consulta dermatológica"
    },
    {
        id: 2,
        paciente: "Carlos Pérez",
        correo: "carlos@gmail.com",
        dermatologo: "María Fernández",
        servicio: "Tratamiento facial",
        fecha: "2026-11-23",
        hora: "10:30",
        estado: "CONFIRMADA",
        motivo: "Evaluación de la piel"
    },
    {
        id: 3,
        paciente: "Sofía Gómez",
        correo: "sofia@gmail.com",
        dermatologo: "Laura Rodríguez",
        servicio: "Tratamiento láser",
        fecha: "2026-11-24",
        hora: "11:00",
        estado: "COMPLETADA",
        motivo: "Tratamiento de manchas"
    },
    {
        id: 4,
        paciente: "Pedro Sánchez",
        correo: "pedro@gmail.com",
        dermatologo: "María Fernández",
        servicio: "Skincare",
        fecha: "2026-11-24",
        hora: "14:00",
        estado: "CANCELADA",
        motivo: "Consulta de cuidado facial"
    },
    {
        id: 5,
        paciente: "Lucía Ramírez",
        correo: "lucia@gmail.com",
        dermatologo: "Laura Rodríguez",
        servicio: "Dermatología General",
        fecha: "2026-11-25",
        hora: "08:30",
        estado: "PENDIENTE",
        motivo: "Revisión dermatológica"
    }
];

// =====================================
// ELEMENTOS DEL DOM
// =====================================

const tablaCitas = document.getElementById("tablaCitas");
const buscarCita = document.getElementById("buscarCita");
const filtroEstado = document.getElementById("filtroEstado");
const filtroFecha = document.getElementById("filtroFecha");

// =====================================
// ACTUALIZAR ESTADÍSTICAS
// =====================================

function actualizarEstadisticas() {

    document.getElementById("totalCitas").textContent = citas.length;

    document.getElementById("citasPendientes").textContent =
        citas.filter(cita => cita.estado === "PENDIENTE").length;

    document.getElementById("citasConfirmadas").textContent =
        citas.filter(cita => cita.estado === "CONFIRMADA").length;

    document.getElementById("citasCompletadas").textContent =
        citas.filter(cita => cita.estado === "COMPLETADA").length;
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

        fila.innerHTML = `
            <td>#${cita.id}</td>

            <td>${cita.paciente}</td>

            <td>${cita.dermatologo}</td>

            <td>${cita.servicio}</td>

            <td>${formatearFecha(cita.fecha)}</td>

            <td>${cita.hora}</td>

            <td>
                <span class="estado ${obtenerClaseEstado(cita.estado)}">
                    ${cita.estado}
                </span>
            </td>

            <td>
                <div class="acciones">

                    <button class="btn-accion btn-detalle"
                        title="Ver detalles"
                        data-accion="detalle"
                        data-id="${cita.id}">
                        <i class="fas fa-eye"></i>
                    </button>

                    ${
                        cita.estado === "PENDIENTE"
                        ? `
                            <button class="btn-accion btn-confirmar"
                                title="Confirmar cita"
                                data-accion="confirmar"
                                data-id="${cita.id}">
                                <i class="fas fa-check"></i>
                            </button>

                            <button class="btn-accion btn-cancelar"
                                title="Cancelar cita"
                                data-accion="cancelar"
                                data-id="${cita.id}">
                                <i class="fas fa-times"></i>
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
// FORMATEAR FECHA
// =====================================

function formatearFecha(fecha) {

    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;
}

// =====================================
// BUSCAR Y FILTRAR CITAS
// =====================================

function filtrarCitas() {

    const texto = buscarCita.value.toLowerCase().trim();
    const estado = filtroEstado.value;
    const fecha = filtroFecha.value;

    const resultado = citas.filter(cita => {

        const coincideTexto =
            cita.paciente.toLowerCase().includes(texto) ||
            cita.dermatologo.toLowerCase().includes(texto) ||
            cita.servicio.toLowerCase().includes(texto);

        const coincideEstado =
            estado === "" || cita.estado === estado;

        const coincideFecha =
            fecha === "" || cita.fecha === fecha;

        return coincideTexto && coincideEstado && coincideFecha;
    });

    mostrarCitas(resultado);
}

// =====================================
// VER DETALLES DE UNA CITA
// =====================================

function verDetalles(id) {

    const cita = citas.find(c => c.id === id);

    if (!cita) return;

    alert(
        `DETALLES DE LA CITA\n\n` +
        `Paciente: ${cita.paciente}\n` +
        `Correo: ${cita.correo}\n` +
        `Dermatólogo: ${cita.dermatologo}\n` +
        `Servicio: ${cita.servicio}\n` +
        `Fecha: ${formatearFecha(cita.fecha)}\n` +
        `Hora: ${cita.hora}\n` +
        `Estado: ${cita.estado}\n` +
        `Motivo: ${cita.motivo}`
    );
}

// =====================================
// CONFIRMAR CITA
// =====================================

function confirmarCita(id) {

    const cita = citas.find(c => c.id === id);

    if (!cita || cita.estado !== "PENDIENTE") return;

    const confirmar = window.confirm(
        `¿Deseas confirmar la cita de ${cita.paciente}?`
    );

    if (confirmar) {

        cita.estado = "CONFIRMADA";

        actualizarEstadisticas();
        filtrarCitas();

        alert("Cita confirmada correctamente (modo demostración).");
    }
}

// =====================================
// CANCELAR CITA
// =====================================

function cancelarCita(id) {

    const cita = citas.find(c => c.id === id);

    if (!cita || cita.estado !== "PENDIENTE") return;

    const cancelar = window.confirm(
        `¿Deseas cancelar la cita de ${cita.paciente}?`
    );

    if (cancelar) {

        cita.estado = "CANCELADA";

        actualizarEstadisticas();
        filtrarCitas();

        alert("Cita cancelada correctamente (modo demostración).");
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

    if (accion === "cancelar") {
        cancelarCita(id);
    }
});

// =====================================
// INICIALIZAR PÁGINA
// =====================================

actualizarEstadisticas();
mostrarCitas();
