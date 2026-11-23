
document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:3000/api";
    const token = localStorage.getItem("token");

    const formulario = document.getElementById("formularioCita");
    const dermatologoSelect = document.getElementById("id_dermatologo");
    const servicioSelect = document.getElementById("id_servicio");
    const fechaInput = document.getElementById("fecha_cita");
    const horaSelect = document.getElementById("hora_cita");
    const motivoInput = document.getElementById("motivo_consulta");
    const mensaje = document.getElementById("mensaje");
    const btnSolicitar = document.getElementById("btnSolicitar");

    let serviciosCargados = [];
    let consultaDisponibilidad = 0;

    // ========================================
    // VERIFICAR SESIÓN
    // ========================================

    if (!token) {
        alert("Debes iniciar sesión para solicitar una cita.");
        window.location.href = "auth/login.html";
        return;
    }

    // ========================================
    // OBTENER FECHA LOCAL
    // ========================================

    function obtenerFechaLocal() {

        const hoy = new Date();

        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    fechaInput.min = obtenerFechaLocal();

    // ========================================
    // MOSTRAR MENSAJES
    // ========================================

    function mostrarMensaje(texto, tipo) {

        mensaje.textContent = texto;
        mensaje.className = "mensaje " + tipo;
    }

    // ========================================
    // VERIFICAR SI UN REGISTRO ESTÁ ACTIVO
    // ========================================

    function estaActivo(registro) {

        return registro.estado === true ||
               registro.estado === "true";
    }

    // ========================================
    // CARGAR DERMATÓLOGOS
    // ========================================

    async function cargarDermatologos() {

        try {

            const respuesta = await fetch(`${API_URL}/dermatologos`);
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje || "No se pudieron cargar los dermatólogos."
                );
            }

            dermatologoSelect.innerHTML =
                '<option value="">Selecciona un dermatólogo</option>';

            const activos = datos.filter(estaActivo);

            activos.forEach(dermatologo => {

                const opcion = document.createElement("option");

                opcion.value = dermatologo.id_dermatologo;

                opcion.textContent =
                    `${dermatologo.nombres} ${dermatologo.apellidos}`;

                dermatologoSelect.appendChild(opcion);
            });

            if (activos.length === 0) {

                dermatologoSelect.innerHTML =
                    '<option value="">No hay dermatólogos disponibles</option>';
            }

        } catch (error) {

            console.error("Error cargando dermatólogos:", error);

            dermatologoSelect.innerHTML =
                '<option value="">Error al cargar dermatólogos</option>';

            mostrarMensaje(error.message, "error");
        }
    }

    // ========================================
    // CARGAR SERVICIOS
    // ========================================

    async function cargarServicios() {

        try {

            const respuesta = await fetch(`${API_URL}/servicios`);
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje || "No se pudieron cargar los servicios."
                );
            }

            serviciosCargados = datos.filter(estaActivo);

            servicioSelect.innerHTML =
                '<option value="">Selecciona un servicio</option>';

            serviciosCargados.forEach(servicio => {

                const opcion = document.createElement("option");

                opcion.value = servicio.id_servicio;

                opcion.textContent =
                    `${servicio.nombre} - RD$ ${servicio.precio}`;

                servicioSelect.appendChild(opcion);
            });

            if (serviciosCargados.length === 0) {

                servicioSelect.innerHTML =
                    '<option value="">No hay servicios disponibles</option>';
            }

        } catch (error) {

            console.error("Error cargando servicios:", error);

            servicioSelect.innerHTML =
                '<option value="">Error al cargar servicios</option>';

            mostrarMensaje(error.message, "error");
        }
    }

    // ========================================
    // CONVERTIR HORA A FORMATO 12 HORAS
    // ========================================

    function convertirHora12Horas(hora) {

        const [horas, minutos] = hora.substring(0, 5).split(":").map(Number);

        const periodo = horas >= 12 ? "p. m." : "a. m.";

        const hora12 = horas % 12 || 12;

        return `${hora12}:${String(minutos).padStart(2, "0")} ${periodo}`;
    }

    // ========================================
    // LIMPIAR HORARIOS
    // ========================================

    function limpiarHorarios(texto = "Selecciona los datos anteriores") {

        consultaDisponibilidad++;

        horaSelect.innerHTML =
            `<option value="">${texto}</option>`;

        horaSelect.disabled = true;
    }

    // ========================================
    // CONSULTAR HORAS DISPONIBLES
    // ========================================

    async function generarHorasDisponibles() {

        const idDermatologo = dermatologoSelect.value;
        const idServicio = servicioSelect.value;
        const fecha = fechaInput.value;

        limpiarHorarios("Selecciona los datos anteriores");

        if (!idDermatologo || !idServicio || !fecha) {
            return;
        }

        // Evitar domingos
        const [anio, mes, dia] = fecha.split("-").map(Number);
        const fechaSeleccionada = new Date(anio, mes - 1, dia);

        if (fechaSeleccionada.getDay() === 0) {

            mostrarMensaje(
                "La clínica no ofrece citas los domingos. Selecciona otro día.",
                "error"
            );

            return;
        }

        // Verificar fecha pasada
        if (fecha < obtenerFechaLocal()) {

            mostrarMensaje(
                "No puedes seleccionar una fecha anterior a hoy.",
                "error"
            );

            return;
        }

        // Verificar servicio
        const servicio = serviciosCargados.find(
            s => String(s.id_servicio) === String(idServicio)
        );

        if (!servicio) {
            mostrarMensaje("Selecciona un servicio válido.", "error");
            return;
        }

        // Identificador para evitar respuestas antiguas
        const consultaActual = ++consultaDisponibilidad;

        horaSelect.innerHTML =
            '<option value="">Consultando disponibilidad...</option>';

        horaSelect.disabled = true;

        try {

            const parametros = new URLSearchParams({
                id_dermatologo: idDermatologo,
                id_servicio: idServicio,
                fecha_cita: fecha
            });

            const respuesta = await fetch(
                `${API_URL}/citas/disponibilidad?${parametros}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const resultado = await respuesta.json();

            // Ignorar resultados de consultas anteriores
            if (consultaActual !== consultaDisponibilidad) {
                return;
            }

            if (!respuesta.ok) {

                throw new Error(
                    resultado.mensaje ||
                    "No se pudo consultar la disponibilidad."
                );
            }

            const horasDisponibles = resultado.horas_disponibles || [];

            horaSelect.innerHTML =
                '<option value="">Selecciona una hora</option>';

            if (horasDisponibles.length === 0) {

                horaSelect.innerHTML =
                    '<option value="">No hay horas disponibles</option>';

                mostrarMensaje(
                    resultado.mensaje ||
                    "No hay horarios disponibles para los datos seleccionados.",
                    "error"
                );

                return;
            }

            // Agregar horas disponibles al desplegable
            horasDisponibles.forEach(hora => {

                const opcion = document.createElement("option");

                opcion.value = hora;

                opcion.textContent = convertirHora12Horas(hora);

                horaSelect.appendChild(opcion);
            });

            horaSelect.disabled = false;

            mostrarMensaje(
                "Selecciona uno de los horarios disponibles.",
                "exito"
            );

        } catch (error) {

            if (consultaActual !== consultaDisponibilidad) {
                return;
            }

            console.error("Error consultando disponibilidad:", error);

            horaSelect.innerHTML =
                '<option value="">Error al consultar horarios</option>';

            horaSelect.disabled = true;

            mostrarMensaje(error.message, "error");
        }
    }

    // ========================================
    // EVENTOS DE LOS CAMPOS
    // ========================================

    dermatologoSelect.addEventListener("change", () => {

        generarHorasDisponibles();
    });

    servicioSelect.addEventListener("change", () => {

        generarHorasDisponibles();
    });

    fechaInput.addEventListener("change", () => {

        if (!fechaInput.value) {

            limpiarHorarios();

            return;
        }

        if (fechaInput.value < obtenerFechaLocal()) {

            mostrarMensaje(
                "No puedes seleccionar una fecha anterior a hoy.",
                "error"
            );

            fechaInput.value = "";

            limpiarHorarios("Selecciona una fecha válida");

            return;
        }

        const [anio, mes, dia] = fechaInput.value.split("-").map(Number);

        const fecha = new Date(anio, mes - 1, dia);

        if (fecha.getDay() === 0) {

            mostrarMensaje(
                "No se permiten citas los domingos.",
                "error"
            );

            fechaInput.value = "";

            limpiarHorarios("Selecciona otra fecha");

            return;
        }

        generarHorasDisponibles();
    });

    // ========================================
    // REGISTRAR CITA
    // ========================================

    formulario.addEventListener("submit", async (e) => {

        e.preventDefault();

        const datosCita = {

            id_dermatologo: dermatologoSelect.value,
            id_servicio: servicioSelect.value,
            fecha_cita: fechaInput.value,
            hora_cita: horaSelect.value,
            motivo_consulta: motivoInput.value.trim()
        };

        // Validar campos obligatorios
        if (
            !datosCita.id_dermatologo ||
            !datosCita.id_servicio ||
            !datosCita.fecha_cita ||
            !datosCita.hora_cita
        ) {

            mostrarMensaje(
                "Completa todos los campos obligatorios.",
                "error"
            );

            return;
        }

        // Validar fecha
        if (datosCita.fecha_cita < obtenerFechaLocal()) {

            mostrarMensaje(
                "No puedes solicitar citas para fechas pasadas.",
                "error"
            );

            return;
        }

        // Validar domingo
        const [anio, mes, dia] = datosCita.fecha_cita.split("-").map(Number);

        const fechaSeleccionada = new Date(anio, mes - 1, dia);

        if (fechaSeleccionada.getDay() === 0) {

            mostrarMensaje(
                "No puedes solicitar citas los domingos.",
                "error"
            );

            return;
        }

        btnSolicitar.disabled = true;

        btnSolicitar.innerHTML = "Enviando solicitud...";

        try {

            const respuesta = await fetch(`${API_URL}/citas`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(datosCita)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {

                throw new Error(
                    resultado.mensaje ||
                    resultado.error ||
                    "No se pudo registrar la cita."
                );
            }

            mostrarMensaje(
                resultado.mensaje ||
                "¡Tu solicitud de cita fue registrada correctamente!",
                "exito"
            );

            formulario.reset();

            fechaInput.min = obtenerFechaLocal();

            limpiarHorarios();

        } catch (error) {

            console.error("Error solicitando cita:", error);

            mostrarMensaje(error.message, "error");

            // Actualizar disponibilidad por si otra persona
            // reservó el horario mientras se completaba el formulario
            generarHorasDisponibles();

        } finally {

            btnSolicitar.disabled = false;

            btnSolicitar.innerHTML =
                '<i class="fa-solid fa-calendar-plus"></i> Solicitar cita';
        }
    });

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

    cargarDermatologos();
    cargarServicios();

});
