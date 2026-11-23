
document.addEventListener("DOMContentLoaded", () => {

    // Verificar que exista una sesión
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión para acceder al área del cliente.");
        window.location.href = "auth/login.html";
        return;
    }

    // Cerrar sesión
    const cerrarSesion = document.getElementById("cerrarSesion");

    cerrarSesion.addEventListener("click", (e) => {

        e.preventDefault();

        const confirmar = confirm("¿Deseas cerrar tu sesión?");

        if (!confirmar) {
            return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        window.location.href = "index.html";

    });

    // MENÚ MÓVIL
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {

            navMenu.classList.toggle("open");

            const abierto = navMenu.classList.contains("open");

            menuToggle.innerHTML = abierto
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';

        });
    }

});
