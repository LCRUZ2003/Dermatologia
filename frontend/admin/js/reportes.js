
// REPORTES - DERMAVITAL

// Datos temporales para las pruebas del módulo.

const datosDemo = {
    citas: [
        { id: 1, paciente: "Ana Martínez", dermatologo: "Laura Rodríguez", servicio: "Dermatología General", fecha: "2026-11-20", estado: "COMPLETADA" },
        { id: 2, paciente: "Carlos Pérez", dermatologo: "María Fernández", servicio: "Tratamiento láser", fecha: "2026-11-21", estado: "CONFIRMADA" },
        { id: 3, paciente: "Sofía Gómez", dermatologo: "Laura Rodríguez", servicio: "Estética facial", fecha: "2026-11-22", estado: "PENDIENTE" },
        { id: 4, paciente: "Pedro Sánchez", dermatologo: "María Fernández", servicio: "Skincare", fecha: "2026-11-22", estado: "CANCELADA" },
        { id: 5, paciente: "Lucía Ramírez", dermatologo: "Laura Rodríguez", servicio: "Dermatología General", fecha: "2026-11-23", estado: "CONFIRMADA" }
    ],

    dermatologos: [
        { id: 1, nombre: "Laura Rodríguez", correo: "laura.rodriguez@gmail.com", telefono: "809-555-1234", estado: "Activo" },
        { id: 2, nombre: "María Fernández", correo: "maria.fernandez@gmail.com", telefono: "829-555-2345", estado: "Activo" },
        { id: 3, nombre: "Carlos Méndez", correo: "carlos.mendez@gmail.com", telefono: "849-555-3456", estado: "Inactivo" }
    ],

    servicios: [
        { id: 1, nombre: "Dermatología General", precio: 1500, duracion: 30, estado: "Activo" },
        { id: 2, nombre: "Tratamiento láser", precio: 3500, duracion: 60, estado: "Activo" },
        { id: 3, nombre: "Estética facial", precio: 2500, duracion: 45, estado: "Activo" },
        { id: 4, nombre: "Skincare", precio: 1200, duracion: 30, estado: "Inactivo" }
    ],

    especialidades: [
        { id: 1, nombre: "Dermatología General", descripcion: "Diagnóstico de enfermedades de la piel.", estado: "Activa" },
        { id: 2, nombre: "Dermatología Estética", descripcion: "Tratamientos estéticos de la piel.", estado: "Activa" },
        { id: 3, nombre: "Dermatología Pediátrica", descripcion: "Atención dermatológica infantil.", estado: "Activa" },
        { id: 4, nombre: "Dermatología Clínica", descripcion: "Manejo de enfermedades dermatológicas.", estado: "Inactiva" }
    ]
};

const tipoReporte = document.getElementById("tipoReporte");
const fechaDesde = document.getElementById("fechaDesde");
const fechaHasta = document.getElementById("fechaHasta");
const estadoReporte = document.getElementById("estadoReporte");

const encabezado = document.getElementById("encabezadoReporte");
const cuerpo = document.getElementById("cuerpoReporte");
const estadisticas = document.getElementById("estadisticasReporte");

// =====================================
// UTILIDADES
// =====================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
    })[c]);
}

function formatoPrecio(valor) {
    return Number(valor).toLocaleString("es-DO", {
        style: "currency",
        currency: "DOP"
    });
}

function formatoFecha(fecha) {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function crearEstadistica(titulo, valor) {
    return `
        <div class="report-stat">
            <span>${titulo}</span>
            <h3>${valor}</h3>
        </div>
    `;
}

// =====================================
// MOSTRAR FILTROS SEGÚN EL REPORTE
// =====================================

function configurarFiltros() {
    const esCitas = tipoReporte.value === "citas";

    document.getElementById("grupoDesde").style.display =
        esCitas ? "flex" : "none";

    document.getElementById("grupoHasta").style.display =
        esCitas ? "flex" : "none";

    document.getElementById("grupoEstado").style.display =
        esCitas ? "flex" : "none";
}

// =====================================
// REPORTE DE CITAS
// =====================================

function generarReporteCitas() {
    let lista = [...datosDemo.citas];

    if (fechaDesde.value) {
        lista = lista.filter(c => c.fecha >= fechaDesde.value);
    }

    if (fechaHasta.value) {
        lista = lista.filter(c => c.fecha <= fechaHasta.value);
    }

    if (estadoReporte.value) {
        lista = lista.filter(c => c.estado === estadoReporte.value);
    }

    const pendientes = lista.filter(c => c.estado === "PENDIENTE").length;
    const confirmadas = lista.filter(c => c.estado === "CONFIRMADA").length;
    const completadas = lista.filter(c => c.estado === "COMPLETADA").length;
    const canceladas = lista.filter(c => c.estado === "CANCELADA").length;

    document.getElementById("tituloResultado").textContent = "Reporte de citas";
    document.getElementById("subtituloResultado").textContent =
        "Resumen de las citas según los filtros seleccionados";

    estadisticas.innerHTML =
        crearEstadistica("Total de citas", lista.length) +
        crearEstadistica("Confirmadas", confirmadas) +
        crearEstadistica("Completadas", completadas) +
        crearEstadistica("Pendientes", pendientes) +
        crearEstadistica("Canceladas", canceladas);

    encabezado.innerHTML = `
        <tr>
            <th>ID</th><th>Paciente</th><th>Dermatólogo</th>
            <th>Servicio</th><th>Fecha</th><th>Estado</th>
        </tr>
    `;

    if (!lista.length) {
        cuerpo.innerHTML = `<tr><td colspan="6" class="report-empty">No hay citas para los filtros seleccionados.</td></tr>`;
    } else {
        cuerpo.innerHTML = lista.map(c => `
            <tr>
                <td>#${c.id}</td>
                <td>${escaparHTML(c.paciente)}</td>
                <td>${escaparHTML(c.dermatologo)}</td>
                <td>${escaparHTML(c.servicio)}</td>
                <td>${formatoFecha(c.fecha)}</td>
                <td>${c.estado}</td>
            </tr>
        `).join("");
    }

    actualizarContador(lista.length);
}

// =====================================
// REPORTE DE DERMATÓLOGOS
// =====================================

function generarReporteDermatologos() {
    const lista = datosDemo.dermatologos;

    const activos = lista.filter(d => d.estado === "Activo").length;
    const inactivos = lista.length - activos;

    document.getElementById("tituloResultado").textContent = "Reporte de dermatólogos";
    document.getElementById("subtituloResultado").textContent =
        "Listado general de profesionales registrados";

    estadisticas.innerHTML =
        crearEstadistica("Total de profesionales", lista.length) +
        crearEstadistica("Profesionales activos", activos) +
        crearEstadistica("Profesionales inactivos", inactivos);

    encabezado.innerHTML = `
        <tr>
            <th>ID</th><th>Profesional</th><th>Correo</th>
            <th>Teléfono</th><th>Estado</th>
        </tr>
    `;

    cuerpo.innerHTML = lista.map(d => `
        <tr>
            <td>#${d.id}</td>
            <td>${escaparHTML(d.nombre)}</td>
            <td>${escaparHTML(d.correo)}</td>
            <td>${escaparHTML(d.telefono)}</td>
            <td>${d.estado}</td>
        </tr>
    `).join("");

    actualizarContador(lista.length);
}

// =====================================
// REPORTE DE SERVICIOS
// =====================================

function generarReporteServicios() {
    const lista = datosDemo.servicios;
    const activos = lista.filter(s => s.estado === "Activo").length;
    const inactivos = lista.length - activos;

    document.getElementById("tituloResultado").textContent = "Reporte de servicios";
    document.getElementById("subtituloResultado").textContent =
        "Listado de servicios, precios y duración";

    estadisticas.innerHTML =
        crearEstadistica("Total de servicios", lista.length) +
        crearEstadistica("Servicios activos", activos) +
        crearEstadistica("Servicios inactivos", inactivos);

    encabezado.innerHTML = `
        <tr>
            <th>ID</th><th>Servicio</th><th>Precio</th>
            <th>Duración</th><th>Estado</th>
        </tr>
    `;

    cuerpo.innerHTML = lista.map(s => `
        <tr>
            <td>#${s.id}</td>
            <td>${escaparHTML(s.nombre)}</td>
            <td>${formatoPrecio(s.precio)}</td>
            <td>${s.duracion} minutos</td>
            <td>${s.estado}</td>
        </tr>
    `).join("");

    actualizarContador(lista.length);
}

// =====================================
// REPORTE DE ESPECIALIDADES
// =====================================

function generarReporteEspecialidades() {
    const lista = datosDemo.especialidades;
    const activas = lista.filter(e => e.estado === "Activa").length;
    const inactivas = lista.length - activas;

    document.getElementById("tituloResultado").textContent = "Reporte de especialidades";
    document.getElementById("subtituloResultado").textContent =
        "Listado de las áreas de especialización registradas";

    estadisticas.innerHTML =
        crearEstadistica("Total de especialidades", lista.length) +
        crearEstadistica("Especialidades activas", activas) +
        crearEstadistica("Especialidades inactivas", inactivas);

    encabezado.innerHTML = `
        <tr>
            <th>ID</th><th>Especialidad</th><th>Descripción</th><th>Estado</th>
        </tr>
    `;

    cuerpo.innerHTML = lista.map(e => `
        <tr>
            <td>#${e.id}</td>
            <td>${escaparHTML(e.nombre)}</td>
            <td>${escaparHTML(e.descripcion)}</td>
            <td>${e.estado}</td>
        </tr>
    `).join("");

    actualizarContador(lista.length);
}

// =====================================
// GENERAR REPORTE SELECCIONADO
// =====================================

function generarReporte() {
    const tipo = tipoReporte.value;

    if (tipo === "citas") generarReporteCitas();
    if (tipo === "dermatologos") generarReporteDermatologos();
    if (tipo === "servicios") generarReporteServicios();
    if (tipo === "especialidades") generarReporteEspecialidades();
}

function actualizarContador(total) {
    document.getElementById("contadorReporte").textContent =
        `${total} ${total === 1 ? "resultado" : "resultados"}`;
}

// =====================================
// LIMPIAR FILTROS
// =====================================

function limpiarFiltros() {
    fechaDesde.value = "";
    fechaHasta.value = "";
    estadoReporte.value = "";
    tipoReporte.value = "citas";

    configurarFiltros();
    generarReporte();
}

// =====================================
// EVENTOS
// =====================================

tipoReporte.addEventListener("change", () => {
    configurarFiltros();
    generarReporte();
});

document.getElementById("btnGenerar").addEventListener("click", () => {
    if (fechaDesde.value && fechaHasta.value && fechaDesde.value > fechaHasta.value) {
        alert("La fecha inicial no puede ser posterior a la fecha final.");
        return;
    }

    generarReporte();
});

document.getElementById("btnLimpiar").addEventListener("click", limpiarFiltros);

document.getElementById("btnImprimir").addEventListener("click", () => {
    window.print();
});

// =====================================
// INICIALIZAR
// =====================================

configurarFiltros();
generarReporte();
