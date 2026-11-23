
document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. VERIFICAR AUTENTICACIÓN Y ROL
    // ========================================

    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    if (!token || !usuario || usuario.codigo_rol !== "ADMIN") {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        window.location.href = "../auth/login.html";
        return;
    }

    // Mostrar nombre del administrador si existe el elemento
    const nombreAdmin = document.getElementById("nombreAdmin");

    if (nombreAdmin) {
        nombreAdmin.textContent = usuario.nombre_usuario;
    }

    // ========================================
    // 2. ABRIR Y CERRAR EL MENÚ LATERAL
    // ========================================

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // ========================================
    // 3. OBTENER ESTADÍSTICAS DEL DASHBOARD
    // ========================================

    async function cargarEstadisticas() {

        try {

            const respuesta = await fetch("/api/admin/dashboard/estadisticas", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (respuesta.status === 401 || respuesta.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("usuario");

                window.location.href = "../auth/login.html";
                return;
            }

            if (!respuesta.ok) {
                throw new Error("No se pudieron obtener las estadísticas.");
            }

            const datos = await respuesta.json();
            const estadisticas = datos.estadisticas;

            document.getElementById("totalCitas").textContent =
                estadisticas.total_citas ?? 0;

            document.getElementById("citasPendientes").textContent =
                estadisticas.citas_pendientes ?? 0;

            document.getElementById("dermatologosActivos").textContent =
                estadisticas.dermatologos_activos ?? 0;

            document.getElementById("serviciosActivos").textContent =
                estadisticas.servicios_activos ?? 0;

            document.getElementById("estadoPendientes").textContent =
                estadisticas.citas_pendientes ?? 0;

            document.getElementById("estadoConfirmadas").textContent =
                estadisticas.citas_confirmadas ?? 0;

            document.getElementById("estadoCompletadas").textContent =
                estadisticas.citas_completadas ?? 0;

            document.getElementById("estadoCanceladas").textContent =
                estadisticas.citas_canceladas ?? 0;

        } catch (error) {

            console.error("Error al cargar el dashboard:", error);

        }
    }

    cargarEstadisticas();

});
