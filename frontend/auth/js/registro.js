
document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. OBTENER ELEMENTOS DEL HTML
    // ========================================

    const registroForm = document.getElementById("registroForm");
    const authMessage = document.getElementById("authMessage");

    const nombreInput = document.getElementById("nombre_usuario");
    const correoInput = document.getElementById("correo_usuario");
    const passwordInput = document.getElementById("password_usuario");
    const confirmarPassword = document.getElementById("confirmar_password");

    const botonRegistro = registroForm.querySelector(".auth-submit");


    // ========================================
    // 2. MOSTRAR Y OCULTAR CONTRASEÑAS
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
    // 4. REGISTRAR USUARIO
    // ========================================

    registroForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        // Obtener valores
        const nombre_usuario = nombreInput.value.trim();
        const correo_usuario = correoInput.value.trim();
        const password_usuario = passwordInput.value;
        const confirmar_password = confirmarPassword.value;


        // Validar que las contraseñas coincidan
        if (password_usuario !== confirmar_password) {

            mostrarMensaje(
                "Las contraseñas no coinciden.",
                "error"
            );

            return;
        }


        // Validar longitud de contraseña
        if (password_usuario.length < 8) {

            mostrarMensaje(
                "La contraseña debe tener al menos 8 caracteres.",
                "error"
            );

            return;
        }


        try {

            botonRegistro.disabled = true;

            botonRegistro.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Registrando...
            `;

            authMessage.style.display = "none";


            // Enviar datos al backend
            const respuesta = await fetch(
                "http://localhost:3000/api/usuarios/registro",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        nombre_usuario,
                        correo_usuario,
                        password_usuario
                    })
                }
            );


            const datos = await respuesta.json();


            // Comprobar respuesta del servidor
            if (!respuesta.ok) {

                throw new Error(
                    datos.mensaje ||
                    datos.error ||
                    "No se pudo completar el registro."
                );

            }


            // Registro exitoso
            mostrarMensaje(
                datos.mensaje || "¡Tu cuenta se ha creado correctamente!",
                "success"
            );

            registroForm.reset();


            // Redirigir al login
            setTimeout(() => {

                window.location.href = "login.html";

            }, 2000);


        } catch (error) {

            console.error("Error en el registro:", error);

            mostrarMensaje(
                error.message || "Ocurrió un error al registrar el usuario.",
                "error"
            );

        } finally {

            botonRegistro.disabled = false;

            botonRegistro.innerHTML = `
                Crear cuenta
                <i class="fa-solid fa-arrow-right"></i>
            `;

        }

    });

});
