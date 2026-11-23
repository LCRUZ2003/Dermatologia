
document.addEventListener("DOMContentLoaded", () => {
 
    // Abrir y cerrar el menú lateral en dispositivos pequeños
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    // Obtener estadísticas del dashboard
    async function cargarEstadisticas() {
        try {
            const respuesta = await fetch("/api/admin/dashboard/estadisticas");

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
