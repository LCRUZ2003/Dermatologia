
document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. OBTENER ELEMENTOS
    // ========================================

    const loginForm = document.getElementById("loginForm");
    const authMessage = document.getElementById("authMessage");

    const correoInput = document.getElementById("correo_usuario");
    const passwordInput = document.getElementById("password_usuario");

    const botonLogin = loginForm.querySelector(".auth-submit");

    // ========================================
    // 2. MOSTRAR Y OCULTAR CONTRASEÑA
    // ========================================

    const botonesPassword = document.querySelectorAll(".toggle-password");

    botonesPassword.forEach((boton) => {
        boton.addEventListener("click", () => {

            const inputId = boton.dataset.target;
            const input = document.getElementById(inputId);

            const mostrar = input.type === "password";

            input.type = mostrar ? "text" : "password";

            boton.innerHTML = mostrar
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';
        });
    });

    // ========================================
    // 3. MOSTRAR MENSAJES
    // ========================================

    function mostrarMensaje(mensaje, tipo) {
        authMessage.textContent = mensaje;
        authMessage.className = `auth-message ${tipo}`;
        authMessage.style.display = "block";
    }

    // ========================================
    // 4. INICIAR SESIÓN
    // ========================================

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const correo_usuario = correoInput.value.trim();
        const password_usuario = passwordInput.value;

        try {

            botonLogin.disabled = true;

            botonLogin.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Iniciando sesión...
            `;

            authMessage.style.display = "none";

            const respuesta = await fetch(
                "http://localhost:3000/api/usuarios/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        correo_usuario,
                        password_usuario
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    datos.error ||
                    "Correo o contraseña incorrectos."
                );
            }

            // Guardar los datos de autenticación
            localStorage.setItem("token", datos.token);
            localStorage.setItem("usuario", JSON.stringify(datos.usuario));

            mostrarMensaje(
                datos.mensaje || "¡Inicio de sesión exitoso!",
                "success"
            );

            // Redirigir según el rol
            setTimeout(() => {

                const rol = datos.usuario?.codigo_rol;

                if (rol === "ADMIN") {
                    window.location.href = "../admin/dashboard.html";
                } else {
                    window.location.href = "../index.html";
                }

            }, 1000);

        } catch (error) {

            console.error("Error en el login:", error);

            mostrarMensaje(
                error.message || "No se pudo iniciar sesión.",
                "error"
            );

        } finally {

            botonLogin.disabled = false;

            botonLogin.innerHTML = `
                Iniciar sesión
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    });

});
