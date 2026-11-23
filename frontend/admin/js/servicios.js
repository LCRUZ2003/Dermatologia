
// SERVICIOS - DERMAVITAL

let servicios = [
    { id: 1, nombre: "Dermatología General", descripcion: "Evaluación y diagnóstico de enfermedades de la piel.", precio: 1500, duracion_minutos: 30, estado: true },
    { id: 2, nombre: "Tratamiento láser", descripcion: "Tratamiento para manchas e imperfecciones cutáneas.", precio: 3500, duracion_minutos: 60, estado: true },
    { id: 3, nombre: "Estética facial", descripcion: "Procedimientos para el cuidado y rejuvenecimiento facial.", precio: 2500, duracion_minutos: 45, estado: true },
    { id: 4, nombre: "Consulta de skincare", descripcion: "Orientación personalizada para el cuidado de la piel.", precio: 1200, duracion_minutos: 30, estado: false }
];

const tablaServicios = document.getElementById("tablaServicios");
const buscarServicio = document.getElementById("buscarServicio");
const filtroEstado = document.getElementById("filtroEstado");
const modal = document.getElementById("modalServicio");
const formulario = document.getElementById("formServicio");

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
    })[c]);
}

function formatoPrecio(precio) {
    return Number(precio).toLocaleString("es-DO", {
        style: "currency",
        currency: "DOP"
    });
}

function actualizarEstadisticas() {
    document.getElementById("totalServicios").textContent = servicios.length;
    document.getElementById("serviciosActivos").textContent =
        servicios.filter(s => s.estado).length;
    document.getElementById("serviciosInactivos").textContent =
        servicios.filter(s => !s.estado).length;
}

function mostrarServicios(lista = servicios) {
    tablaServicios.innerHTML = "";

    if (!lista.length) {
        tablaServicios.innerHTML = `
            <tr><td colspan="7" class="empty-message">No se encontraron servicios.</td></tr>`;
    } else {
        lista.forEach(servicio => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>#${servicio.id}</td>
                <td><span class="service-name">${escaparHTML(servicio.nombre)}</span></td>
                <td><span class="service-description">${escaparHTML(servicio.descripcion || "Sin descripción")}</span></td>
                <td>${formatoPrecio(servicio.precio)}</td>
                <td>${servicio.duracion_minutos} min</td>
                <td>
                    <span class="service-status ${servicio.estado ? "status-active" : "status-inactive"}">
                        ${servicio.estado ? "ACTIVO" : "INACTIVO"}
                    </span>
                </td>
                <td>
                    <div class="service-actions">
                        <button class="btn-action btn-edit" title="Editar"
                            data-accion="editar" data-id="${servicio.id}">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-action btn-toggle"
                            title="${servicio.estado ? "Desactivar" : "Activar"}"
                            data-accion="estado" data-id="${servicio.id}">
                            <i class="fas ${servicio.estado ? "fa-ban" : "fa-check"}"></i>
                        </button>
                    </div>
                </td>
            `;
            tablaServicios.appendChild(fila);
        });
    }

    document.getElementById("contadorServicios").textContent =
        `Mostrando ${lista.length} ${lista.length === 1 ? "servicio" : "servicios"}`;
}

function filtrarServicios() {
    const texto = buscarServicio.value.toLowerCase().trim();
    const estado = filtroEstado.value;

    const resultado = servicios.filter(s => {
        const coincideTexto =
            s.nombre.toLowerCase().includes(texto) ||
            (s.descripcion || "").toLowerCase().includes(texto);

        const coincideEstado =
            estado === "" ||
            (estado === "activo" && s.estado) ||
            (estado === "inactivo" && !s.estado);

        return coincideTexto && coincideEstado;
    });

    mostrarServicios(resultado);
}

function abrirModal() {
    formulario.reset();
    document.getElementById("idServicio").value = "";
    document.getElementById("tituloModal").textContent = "Nuevo servicio";
    modal.classList.add("show");
}

function cerrarModal() {
    modal.classList.remove("show");
    formulario.reset();
}

function editarServicio(id) {
    const servicio = servicios.find(s => s.id === id);
    if (!servicio) return;

    document.getElementById("idServicio").value = servicio.id;
    document.getElementById("nombreServicio").value = servicio.nombre;
    document.getElementById("descripcionServicio").value = servicio.descripcion;
    document.getElementById("precioServicio").value = servicio.precio;
    document.getElementById("duracionServicio").value = servicio.duracion_minutos;

    document.getElementById("tituloModal").textContent = "Editar servicio";
    modal.classList.add("show");
}

formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const id = document.getElementById("idServicio").value;
    const datos = {
        nombre: document.getElementById("nombreServicio").value.trim(),
        descripcion: document.getElementById("descripcionServicio").value.trim(),
        precio: Number(document.getElementById("precioServicio").value),
        duracion_minutos: Number(document.getElementById("duracionServicio").value)
    };

    if (!datos.nombre || datos.precio <= 0 || datos.duracion_minutos <= 0) {
        alert("Verifica los datos del servicio.");
        return;
    }

    const duplicado = servicios.some(s =>
        s.nombre.toLowerCase() === datos.nombre.toLowerCase() &&
        s.id !== Number(id)
    );

    if (duplicado) {
        alert("Ya existe un servicio con ese nombre.");
        return;
    }

    if (id) {
        const indice = servicios.findIndex(s => s.id === Number(id));
        if (indice === -1) return;
        servicios[indice] = { ...servicios[indice], ...datos };
        alert("Servicio actualizado (modo demostración).");
    } else {
        servicios.push({
            id: servicios.length ? Math.max(...servicios.map(s => s.id)) + 1 : 1,
            ...datos,
            estado: true
        });
        alert("Servicio registrado (modo demostración).");
    }

    cerrarModal();
    actualizarEstadisticas();
    filtrarServicios();
});

function cambiarEstadoServicio(id) {
    const servicio = servicios.find(s => s.id === id);
    if (!servicio) return;

    const nuevoEstado = !servicio.estado;

    if (!confirm(`¿Deseas ${nuevoEstado ? "activar" : "desactivar"} "${servicio.nombre}"?`)) return;

    servicio.estado = nuevoEstado;
    actualizarEstadisticas();
    filtrarServicios();
}

tablaServicios.addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.dataset.accion === "editar") editarServicio(id);
    if (boton.dataset.accion === "estado") cambiarEstadoServicio(id);
});

document.getElementById("btnNuevoServicio").addEventListener("click", abrirModal);
document.getElementById("cerrarModal").addEventListener("click", cerrarModal);
document.getElementById("cancelarModal").addEventListener("click", cerrarModal);
buscarServicio.addEventListener("input", filtrarServicios);
filtroEstado.addEventListener("change", filtrarServicios);

modal.addEventListener("click", evento => {
    if (evento.target === modal) cerrarModal();
});

actualizarEstadisticas();
mostrarServicios();
