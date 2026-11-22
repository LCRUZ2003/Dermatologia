
document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    // Abrir y cerrar el menú móvil
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("open");

        const abierto = navMenu.classList.contains("open");

        menuToggle.innerHTML = abierto
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';

        menuToggle.setAttribute("aria-expanded", abierto);
    });

    // Cerrar menú al seleccionar una sección
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("open");
            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

});
