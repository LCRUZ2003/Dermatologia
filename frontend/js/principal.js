
document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    // ========================================
    // 1. OBTENER DATOS DE SESIÓN
    // ========================================

    const token = localStorage.getItem("token");

    let usuario = null;

    try {
        usuario = JSON.parse(localStorage.getItem("usuario"));
    } catch (error) {
        console.error("Error leyendo los datos del usuario:", error);
    }

    const rol = usuario?.codigo_rol;

    const enlaceLogin = document.getElementById("enlaceLogin");
    const enlaceRegistro = document.getElementById("enlaceRegistro");
    const cerrarSesion = document.getElementById("cerrarSesion");

    const opcionesCliente = document.querySelectorAll(".opcion-cliente");

    // ========================================
    // 2. MOSTRAR OPCIONES SEGÚN EL ROL
    // ========================================

    if (token) {

        // Ocultar opciones de visitante
        if (enlaceLogin) enlaceLogin.style.display = "none";
        if (enlaceRegistro) enlaceRegistro.style.display = "none";

        // Mostrar cerrar sesión
        if (cerrarSesion) cerrarSesion.style.display = "inline-block";

        // Mostrar opciones solamente al cliente
        if (rol === "CLIENTE") {

            opcionesCliente.forEach(opcion => {
                opcion.style.display = "inline-block";
            });

        }

    } else {

        // Usuario sin sesión
        if (enlaceLogin) enlaceLogin.style.display = "inline-block";
        if (enlaceRegistro) enlaceRegistro.style.display = "inline-block";
        if (cerrarSesion) cerrarSesion.style.display = "none";

        opcionesCliente.forEach(opcion => {
            opcion.style.display = "none";
        });

    }

    // ========================================
    // 3. CERRAR SESIÓN
    // ========================================

    if (cerrarSesion) {

        cerrarSesion.addEventListener("click", (e) => {

            e.preventDefault();

            const confirmar = confirm(
                "¿Estás seguro de que deseas cerrar sesión?"
            );

            if (confirmar) {

                localStorage.removeItem("token");
                localStorage.removeItem("usuario");

                alert("Has cerrado sesión correctamente.");

                window.location.href = "index.html";

            }

        });

    }

    // ========================================
    // 4. MENÚ MÓVIL
    // ========================================

    if (menuToggle && navMenu) {

        menuToggle.addEventListener("click", () => {

            navMenu.classList.toggle("open");

            const abierto = navMenu.classList.contains("open");

            menuToggle.innerHTML = abierto
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';

            menuToggle.setAttribute("aria-expanded", abierto);

        });

        document.querySelectorAll(".nav-link").forEach(link => {

            link.addEventListener("click", () => {

                navMenu.classList.remove("open");

                menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

                menuToggle.setAttribute("aria-expanded", "false");

            });

        });

    }

    // ========================================
    // 5. AGENDAR CITA
    // ========================================

    // ========================================
    // 5. AGENDAR CITA
    // ========================================

    document.querySelectorAll(".btn-agendar-cita").forEach(boton => {

        boton.addEventListener("click", (e) => { 

            e.preventDefault();

            const tokenActual = localStorage.getItem("token");

            let usuarioActual = null;

            try {
                usuarioActual = JSON.parse(
                    localStorage.getItem("usuario")
                );
            } catch (error) {
                console.error("Error leyendo usuario:", error);
            }

            const rolActual = usuarioActual?.codigo_rol;

            if (tokenActual && (rolActual === "CLIENTE" || rolActual === "CLIE")) {

                window.location.href = "citas/solicitarcita.html";

            } else if (tokenActual) {

                alert("Esta opción está disponible para clientes.");

            } else {

                window.location.href = "auth/login.html";

            }

        });

    });

});
