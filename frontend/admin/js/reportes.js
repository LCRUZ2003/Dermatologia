
// =====================================
// REPORTES - DERMAVITAL
// Conectado a PostgreSQL y PDFKit
// =====================================

const API = "/api/admin/reportes";

const tipoReporte = document.getElementById("tipoReporte");
const fechaDesde = document.getElementById("fechaDesde");
const fechaHasta = document.getElementById("fechaHasta");
const estadoReporte = document.getElementById("estadoReporte");

const encabezado = document.getElementById("encabezadoReporte");
const cuerpo = document.getElementById("cuerpoReporte");
const estadisticas = document.getElementById("estadisticasReporte");

// =====================================
// CONFIGURACIÓN DE PETICIONES
// =====================================

function obtenerHeaders() {
    const token = localStorage.getItem("token");

    return {
        ...(token && {
            Authorization: `Bearer ${token}`
        })
    };
}

// =====================================
// INFORMACIÓN DE LOS REPORTES
// =====================================

const reportes = {
    citas: {
        titulo: "Reporte de citas",
        descripcion: "Informe de citas registradas en Dermavital.",
        archivo: "reporte_citas.pdf"
    },

    dermatologos: {
        titulo: "Reporte de dermatólogos",
        descripcion: "Listado de profesionales registrados.",
        archivo: "reporte_dermatologos.pdf"
    },

    servicios: {
        titulo: "Reporte de servicios",
        descripcion: "Listado de servicios, precios y duración.",
        archivo: "reporte_servicios.pdf"
    },

    especialidades: {
        titulo: "Reporte de especialidades",
        descripcion: "Listado de especialidades registradas.",
        archivo: "reporte_especialidades.pdf"
    },

    clientes: {
        titulo: "Reporte de clientes",
        descripcion: "Listado de clientes registrados en Dermavital.",
        archivo: "reporte_clientes.pdf"
    }
};

// =====================================
// MOSTRAR FILTROS
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
// ACTUALIZAR VISTA PREVIA
// =====================================

function mostrarVistaPrevia() {
    const tipo = tipoReporte.value;
    const reporte = reportes[tipo];

    if (!reporte) return;

    document.getElementById("tituloResultado").textContent =
        reporte.titulo;

    document.getElementById("subtituloResultado").textContent =
        reporte.descripcion;

    estadisticas.innerHTML = `
        <div class="report-stat">
            <span>Tipo de informe</span>
            <h3>${reporte.titulo.replace("Reporte de ", "")}</h3>
        </div>

        <div class="report-stat">
            <span>Origen de información</span>
            <h3>PostgreSQL</h3>
        </div>

        <div class="report-stat">
            <span>Formato</span>
            <h3>PDF</h3>
        </div>
    `;

    encabezado.innerHTML = "";

    cuerpo.innerHTML = `
        <tr>
            <td colspan="7" class="report-empty">
                <i class="fas fa-file-pdf"></i>
                <p>
                    Selecciona "Generar reporte" para obtener
                    el informe actualizado desde la base de datos.
                </p>
            </td>
        </tr>
    `;

    document.getElementById("contadorReporte").textContent =
        "Informe disponible en formato PDF";
}

// =====================================
// VALIDAR FILTROS
// =====================================

function validarFiltros() {
    if (
        fechaDesde.value &&
        fechaHasta.value &&
        fechaDesde.value > fechaHasta.value
    ) {
        alert("La fecha inicial no puede ser posterior a la fecha final.");
        return false;
    }

    return true;
}

// =====================================
// GENERAR Y DESCARGAR PDF
// =====================================

async function generarReporte() {
    if (!validarFiltros()) return;

    const tipo = tipoReporte.value;
    const reporte = reportes[tipo];

    if (!reporte) {
        alert("Selecciona un tipo de reporte válido.");
        return;
    }

    const parametros = new URLSearchParams();

    if (tipo === "citas") {
        if (fechaDesde.value) {
            parametros.append("desde", fechaDesde.value);
        }

        if (fechaHasta.value) {
            parametros.append("hasta", fechaHasta.value);
        }

        if (estadoReporte.value) {
            parametros.append("estado", estadoReporte.value);
        }
    }

    const query = parametros.toString();

    const url = `${API}/${tipo}${query ? `?${query}` : ""}`;

    const btnGenerar = document.getElementById("btnGenerar");
    const btnImprimir = document.getElementById("btnImprimir");

    btnGenerar.disabled = true;
    btnImprimir.disabled = true;

    btnGenerar.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Generando...
    `;

    try {
        const respuesta = await fetch(url, {
            method: "GET",
            headers: obtenerHeaders()
        });

        if (!respuesta.ok) {
            let mensaje = "No fue posible generar el reporte.";

            const tipoContenido = respuesta.headers.get("content-type") || "";

            if (tipoContenido.includes("application/json")) {
                const error = await respuesta.json();
                mensaje = error.mensaje || mensaje;
            }

            throw new Error(mensaje);
        }

        const tipoContenido = respuesta.headers.get("content-type") || "";

        if (!tipoContenido.includes("application/pdf")) {
            throw new Error("El servidor no devolvió un archivo PDF válido.");
        }

        const archivo = await respuesta.blob();

        const urlArchivo = URL.createObjectURL(archivo);

        const enlace = document.createElement("a");

        enlace.href = urlArchivo;
        enlace.download = reporte.archivo;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => {
            URL.revokeObjectURL(urlArchivo);
        }, 1000);

        alert("Reporte generado y descargado correctamente.");

        mostrarVistaPrevia();

    } catch (error) {
        console.error("Error al generar reporte:", error);

        alert(error.message);

    } finally {
        btnGenerar.disabled = false;
        btnImprimir.disabled = false;

        btnGenerar.innerHTML = `
            <i class="fas fa-magnifying-glass"></i>
            Generar reporte
        `;
    }
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
    mostrarVistaPrevia();
}

// =====================================
// EVENTOS
// =====================================

tipoReporte.addEventListener("change", () => {
    configurarFiltros();
    mostrarVistaPrevia();
});

document.getElementById("btnGenerar")
    .addEventListener("click", generarReporte);

document.getElementById("btnImprimir")
    .addEventListener("click", generarReporte);

document.getElementById("btnLimpiar")
    .addEventListener("click", limpiarFiltros);

// =====================================
// INICIALIZAR
// =====================================

configurarFiltros();
mostrarVistaPrevia();
