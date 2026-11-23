
document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");

    const listaCitas = document.getElementById("listaCitas");
    const mensaje = document.getElementById("mensaje");
    const btnActualizar = document.getElementById("btnActualizar");

    const totalCitas = document.getElementById("totalCitas");
    const citasPendientes = document.getElementById("citasPendientes");
    const citasConfirmadas = document.getElementById("citasConfirmadas");

    // ========================================
    // VERIFICAR SESIÓN
    // ========================================

    if (!token) {
        alert("Debes iniciar sesión para consultar tus citas.");
        window.location.href = "../auth/login.html";
        return;
    }

    // ========================================
    // MOSTRAR MENSAJES
    // ========================================

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = "mensaje " + tipo;
    }

    function ocultarMensaje() {
        mensaje.textContent = "";
        mensaje.className = "mensaje";
    }

    // ========================================
    // FORMATEAR FECHA
    // ========================================

    function formatearFecha(fecha) {

        if (!fecha) return "No especificada";

        const [anio, mes, dia] = String(fecha).substring(0, 10).split("-");

        const fechaLocal = new Date(
            Number(anio),
            Number(mes) - 1,
            Number(dia)
        );

        return fechaLocal.toLocaleDateString("es-DO", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    // ========================================
    // FORMATEAR HORA
    // ========================================

    function formatearHora(hora) {

        if (!hora) return "No especificada";

        const [horas, minutos] = String(hora).substring(0, 5).split(":").map(Number);

        const periodo = horas >= 12 ? "p. m." : "a. m.";
        const hora12 = horas % 12 || 12;

        return `${hora12}:${String(minutos).padStart(2, "0")} ${periodo}`;
    }

    // ========================================
    // OBTENER ESTADO
    // ========================================

    function obtenerEstado(estado) {
        return String(estado || "").toUpperCase();
    }

    function obtenerClaseEstado(estado) {

        switch (obtenerEstado(estado)) {

            case "PENDIENTE":
                return "estado-pendiente";

            case "CONFIRMADA":
                return "estado-confirmada";

            case "CANCELADA":
                return "estado-cancelada";

            case "COMPLETADA":
                return "estado-completada";

            default:
                return "";
        }
    }

    // ========================================
    // ACTUALIZAR CONTADORES
    // ========================================

    function actualizarResumen(citas) {

        totalCitas.textContent = citas.length;

        citasPendientes.textContent = citas.filter(
            cita => obtenerEstado(cita.estado_cita) === "PENDIENTE"
        ).length;

        citasConfirmadas.textContent = citas.filter(
            cita => obtenerEstado(cita.estado_cita) === "CONFIRMADA"
        ).length;
    }

    // ========================================
    // MOSTRAR CITAS
    // ========================================

    function mostrarCitas(citas) {

        listaCitas.innerHTML = "";

        actualizarResumen(citas);

        if (citas.length === 0) {

            listaCitas.innerHTML = `
                <div class="sin-citas">
                    <i class="fa-solid fa-calendar-xmark"></i>

                    <h3>No tienes citas registradas</h3>

                    <p>
                        Cuando solicites una cita médica,
                        aparecerá aquí.
                    </p>

                    <a href="solicitarcita.html" class="btn-solicitar">
                        <i class="fa-solid fa-calendar-plus"></i>
                        Solicitar una cita
                    </a>
                </div>
            `;

            return;
        }

        citas.forEach(cita => {

            const estado = obtenerEstado(cita.estado_cita);

            const puedeCancelar =
                estado === "PENDIENTE" ||
                estado === "CONFIRMADA";

            const tarjeta = document.createElement("article");

            tarjeta.className = "tarjeta-cita";

            tarjeta.innerHTML = `
                <div class="cabecera-cita">

                    <h3>
                        Cita #${cita.id_cita}
                    </h3>

                    <span class="estado ${obtenerClaseEstado(estado)}">
                        ${estado}
                    </span>

                </div>

                <div class="detalles-cita">

                    <div class="detalle">
                        <i class="fa-solid fa-user-doctor"></i>
                        <div>
                            <span>Dermatólogo</span>
                            <strong>
                               ${cita.nombre_dermatologo || ""} ${cita.apellido_dermatologo || ""}
                            </strong>
                        </div>
                    </div>

                    <div class="detalle">
                        <i class="fa-solid fa-stethoscope"></i>
                        <div>
                            <span>Servicio</span>
                            <strong>${cita.nombre_servicio || "No especificado"}</strong>
                        </div>
                    </div>

                    <div class="detalle">
                        <i class="fa-solid fa-calendar"></i>
                        <div>
                            <span>Fecha</span>
                            <strong>${formatearFecha(cita.fecha_cita)}</strong>
                        </div>
                    </div>

                    <div class="detalle">
                        <i class="fa-solid fa-clock"></i>
                        <div>
                            <span>Hora</span>
                            <strong>${formatearHora(cita.hora_cita)}</strong>
                        </div>
                    </div>

                    <div class="detalle">
                        <i class="fa-solid fa-money-bill-wave"></i>
                        <div>
                            <span>Precio</span>
                            <strong>
                                RD$ ${cita.precio ?? "No especificado"}
                            </strong>
                        </div>
                    </div>

                    <div class="detalle">
                        <i class="fa-solid fa-file-medical"></i>
                        <div>
                            <span>Motivo de consulta</span>
                            <strong>
                                ${cita.motivo_consulta || "No especificado"}
                            </strong>
                        </div>
                    </div>

                </div>

                ${
                    puedeCancelar
                    ? `
                        <div class="acciones-cita">
                            <button
                                class="btn-cancelar"
                                type="button"
                                data-id="${cita.id_cita}">
                                <i class="fa-solid fa-ban"></i>
                                Cancelar cita
                            </button>
                        </div>
                    `
                    : ""
                }
            `;

            listaCitas.appendChild(tarjeta);
        });

        // Registrar eventos de cancelación
        document.querySelectorAll(".btn-cancelar").forEach(boton => {

            boton.addEventListener("click", () => {
                cancelarCita(boton.dataset.id, boton);
            });

        });
    }

    // ========================================
    // CONSULTAR MIS CITAS
    // ========================================

    
async function cargarMisCitas() {

    ocultarMensaje();

    listaCitas.innerHTML = `
        <div class="cargando">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Cargando tus citas...
        </div>
    `;

    btnActualizar.disabled = true;

    try {

        const respuesta = await fetch(`${API_URL}/citas/miscitas`, {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const resultado = await respuesta.json();

        console.log("Código HTTP:", respuesta.status);
        console.log("Respuesta del servidor:", resultado);

        if (respuesta.status === 401 || respuesta.status === 403) {

            alert("Tu sesión ha expirado. Inicia sesión nuevamente.");

            localStorage.removeItem("token");
            localStorage.removeItem("usuario");

            window.location.href = "../auth/login.html";

            return;
        }

        if (!respuesta.ok) {

            throw new Error(
                resultado.mensaje ||
                "No se pudieron consultar tus citas."
            );
        }

        // Obtener el arreglo de citas
        const citas = resultado.citas;

        if (!Array.isArray(citas)) {
            throw new Error("El servidor no devolvió una lista válida de citas.");
        }

        // Mostrar las citas
        mostrarCitas(citas);

    } catch (error) {

        console.error("Error consultando citas:", error);

        listaCitas.innerHTML = `
            <div class="sin-citas">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>No se pudieron cargar tus citas</h3>
                <p>${error.message}</p>
            </div>
        `;

    } finally {

        btnActualizar.disabled = false;

    }
}


    // ========================================
    // CANCELAR CITA
    // ========================================

    async function cancelarCita(id, boton) {

        const confirmar = window.confirm(
            "¿Estás segura de que deseas cancelar esta cita?"
        );

        if (!confirmar) {
            return;
        }

        boton.disabled = true;
        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Cancelando...
        `;

        try {

            const respuesta = await fetch(
                `${API_URL}/citas/${id}/cancelar`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {

                throw new Error(
                    resultado.mensaje ||
                    "No se pudo cancelar la cita."
                );
            }

            mostrarMensaje(
                resultado.mensaje || "La cita fue cancelada correctamente.",
                "exito"
            );

            await cargarMisCitas();

        } catch (error) {

            console.error("Error cancelando cita:", error);

            mostrarMensaje(error.message, "error");

            boton.disabled = false;

            boton.innerHTML = `
                <i class="fa-solid fa-ban"></i>
                Cancelar cita
            `;

        }
    }

    // ========================================
    // ACTUALIZAR LISTADO
    // ========================================

    btnActualizar.addEventListener("click", cargarMisCitas);

    // ========================================
    // CERRAR SESIÓN
    // ========================================

    document.getElementById("cerrarSesion").addEventListener("click", (e) => {

        e.preventDefault();

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        window.location.href = "../index.html";

    });

    // ========================================
    // CARGAR DATOS INICIALES
    // ========================================

    cargarMisCitas();

});
