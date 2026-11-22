
// HORARIOS - DERMAVITAL

const dermatologosDisponibles = [
    { id: 1, nombre: "Laura Rodríguez" },
    { id: 2, nombre: "María Fernández" },
    { id: 3, nombre: "Carlos Méndez" }
];

let horarios = [
    { id: 1, id_dermatologo: 1, dermatologo: "Laura Rodríguez", dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "12:00", estado: true },
    { id: 2, id_dermatologo: 1, dermatologo: "Laura Rodríguez", dia_semana: "Miércoles", hora_inicio: "08:00", hora_fin: "14:00", estado: true },
    { id: 3, id_dermatologo: 2, dermatologo: "María Fernández", dia_semana: "Martes", hora_inicio: "09:00", hora_fin: "15:00", estado: true },
    { id: 4, id_dermatologo: 2, dermatologo: "María Fernández", dia_semana: "Jueves", hora_inicio: "10:00", hora_fin: "16:00", estado: false }
];

const tablaHorarios = document.getElementById("tablaHorarios");
const buscarHorario = document.getElementById("buscarHorario");
const filtroDia = document.getElementById("filtroDia");
const filtroEstado = document.getElementById("filtroEstado");
const modal = document.getElementById("modalHorario");
const formulario = document.getElementById("formHorario");

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
    })[c]);
}

function cargarDermatologos() {
    const select = document.getElementById("dermatologoHorario");

    dermatologosDisponibles.forEach(doctor => {
        const opcion = document.createElement("option");
        opcion.value = doctor.id;
        opcion.textContent = doctor.nombre;
        select.appendChild(opcion);
    });
}

function actualizarEstadisticas() {
    document.getElementById("totalHorarios").textContent = horarios.length;
    document.getElementById("horariosActivos").textContent =
        horarios.filter(h => h.estado).length;
    document.getElementById("horariosInactivos").textContent =
        horarios.filter(h => !h.estado).length;
}

function mostrarHorarios(lista = horarios) {
    tablaHorarios.innerHTML = "";

    if (!lista.length) {
        tablaHorarios.innerHTML =
            `<tr><td colspan="7" class="empty-message">No se encontraron horarios.</td></tr>`;
    } else {
        lista.forEach(horario => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>#${horario.id}</td>
                <td>${escaparHTML(horario.dermatologo)}</td>
                <td>${escaparHTML(horario.dia_semana)}</td>
                <td>${horario.hora_inicio}</td>
                <td>${horario.hora_fin}</td>
                <td>
                    <span class="schedule-status ${horario.estado ? "status-active" : "status-inactive"}">
                        ${horario.estado ? "ACTIVO" : "INACTIVO"}
                    </span>
                </td>
                <td>
                    <div class="schedule-actions">
                        <button class="btn-action btn-edit" title="Editar"
                            data-accion="editar" data-id="${horario.id}">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-action btn-toggle"
                            title="${horario.estado ? "Desactivar" : "Activar"}"
                            data-accion="estado" data-id="${horario.id}">
                            <i class="fas ${horario.estado ? "fa-ban" : "fa-check"}"></i>
                        </button>
                    </div>
                </td>
            `;
            tablaHorarios.appendChild(fila);
        });
    }

    document.getElementById("contadorHorarios").textContent =
        `Mostrando ${lista.length} ${lista.length === 1 ? "horario" : "horarios"}`;
}

function filtrarHorarios() {
    const texto = buscarHorario.value.toLowerCase().trim();
    const dia = filtroDia.value;
    const estado = filtroEstado.value;

    const resultado = horarios.filter(h => {
        const coincideNombre = h.dermatologo.toLowerCase().includes(texto);
        const coincideDia = dia === "" || h.dia_semana === dia;
        const coincideEstado =
            estado === "" ||
            (estado === "activo" && h.estado) ||
            (estado === "inactivo" && !h.estado);

        return coincideNombre && coincideDia && coincideEstado;
    });

    mostrarHorarios(resultado);
}

function abrirModal() {
    formulario.reset();
    document.getElementById("idHorario").value = "";
    document.getElementById("tituloModal").textContent = "Nuevo horario";
    modal.classList.add("show");
}

function cerrarModal() {
    modal.classList.remove("show");
    formulario.reset();
}

function editarHorario(id) {
    const horario = horarios.find(h => h.id === id);
    if (!horario) return;

    document.getElementById("idHorario").value = horario.id;
    document.getElementById("dermatologoHorario").value = horario.id_dermatologo;
    document.getElementById("diaSemana").value = horario.dia_semana;
    document.getElementById("horaInicio").value = horario.hora_inicio;
    document.getElementById("horaFin").value = horario.hora_fin;
    document.getElementById("tituloModal").textContent = "Editar horario";

    modal.classList.add("show");
}

function existeCruceHorario(datos, idActual) {
    const inicioNuevo = datos.hora_inicio;
    const finNuevo = datos.hora_fin;

    return horarios.some(h => {
        if (!h.estado || h.id === Number(idActual)) return false;

        const mismoProfesional = h.id_dermatologo === datos.id_dermatologo;
        const mismoDia = h.dia_semana === datos.dia_semana;
        const seCruzan =
            inicioNuevo < h.hora_fin &&
            finNuevo > h.hora_inicio;

        return mismoProfesional && mismoDia && seCruzan;
    });
}

formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const id = document.getElementById("idHorario").value;
    const idDermatologo = Number(document.getElementById("dermatologoHorario").value);
    const doctor = dermatologosDisponibles.find(d => d.id === idDermatologo);

    const datos = {
        id_dermatologo: idDermatologo,
        dermatologo: doctor.nombre,
        dia_semana: document.getElementById("diaSemana").value,
        hora_inicio: document.getElementById("horaInicio").value,
        hora_fin: document.getElementById("horaFin").value
    };

    if (datos.hora_inicio >= datos.hora_fin) {
        alert("La hora de finalización debe ser posterior a la hora de inicio.");
        return;
    }

    if (existeCruceHorario(datos, id)) {
        alert("Este profesional ya tiene un horario que se cruza en ese día.");
        return;
    }

    if (id) {
        const indice = horarios.findIndex(h => h.id === Number(id));
        if (indice === -1) return;

        horarios[indice] = { ...horarios[indice], ...datos };
        alert("Horario actualizado (modo demostración).");
    } else {
        horarios.push({
            id: horarios.length ? Math.max(...horarios.map(h => h.id)) + 1 : 1,
            ...datos,
            estado: true
        });
        alert("Horario registrado (modo demostración).");
    }

    cerrarModal();
    actualizarEstadisticas();
    filtrarHorarios();
});

function cambiarEstadoHorario(id) {
    const horario = horarios.find(h => h.id === id);
    if (!horario) return;

    const nuevoEstado = !horario.estado;

    if (!confirm(`¿Deseas ${nuevoEstado ? "activar" : "desactivar"} este horario?`)) return;

    horario.estado = nuevoEstado;
    actualizarEstadisticas();
    filtrarHorarios();
}

tablaHorarios.addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.dataset.accion === "editar") editarHorario(id);
    if (boton.dataset.accion === "estado") cambiarEstadoHorario(id);
});

document.getElementById("btnNuevoHorario").addEventListener("click", abrirModal);
document.getElementById("cerrarModal").addEventListener("click", cerrarModal);
document.getElementById("cancelarModal").addEventListener("click", cerrarModal);
buscarHorario.addEventListener("input", filtrarHorarios);
filtroDia.addEventListener("change", filtrarHorarios);
filtroEstado.addEventListener("change", filtrarHorarios);

modal.addEventListener("click", evento => {
    if (evento.target === modal) cerrarModal();
});

cargarDermatologos();
actualizarEstadisticas();
mostrarHorarios();
