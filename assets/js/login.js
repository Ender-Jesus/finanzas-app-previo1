document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');

    // --- Lógica de Pestañas (Tab Switching) ---
    tabLogin.addEventListener('click', () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));

    function switchTab(mode) {
        if (mode === 'login') {
            // Activar tab login
            tabLogin.classList.add('bg-surface-container-lowest', 'text-on-secondary-fixed', 'shadow-sm');
            tabLogin.classList.remove('text-on-surface-variant');
            // Desactivar tab register
            tabRegister.classList.remove('bg-surface-container-lowest', 'text-on-secondary-fixed', 'shadow-sm');
            tabRegister.classList.add('text-on-surface-variant');
            // Mostrar/Ocultar formularios
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            authTitle.textContent = 'Bienvenido de nuevo';
            authSubtitle.textContent = 'Gestiona tu futuro académico y financiero con precisión.';
        } else {
            // Activar tab register
            tabRegister.classList.add('bg-surface-container-lowest', 'text-on-secondary-fixed', 'shadow-sm');
            tabRegister.classList.remove('text-on-surface-variant');
            // Desactivar tab login
            tabLogin.classList.remove('bg-surface-container-lowest', 'text-on-secondary-fixed', 'shadow-sm');
            tabLogin.classList.add('text-on-surface-variant');
            // Mostrar/Ocultar formularios
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            authTitle.textContent = 'Crea tu cuenta';
            authSubtitle.textContent = 'Únete a la mejor plataforma de gestión financiera universitaria.';
        }
        resetErrors();
    }

    // --- Toggle Password Visibility ---
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            btn.querySelector('span').textContent = type === 'password' ? 'visibility' : 'visibility_off';
        });
    });

    // --- Registro de Usuario ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetErrors();

        const nombre = document.getElementById('reg-nombre').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;

        // Validaciones
        let hasError = false;
        if (!nombre) { showInlineError('reg-nombre', 'El nombre es obligatorio'); hasError = true; }
        if (!validateEmail(email)) { showInlineError('reg-email', 'Email no válido'); hasError = true; }
        if (password.length < 6) { showInlineError('reg-password', 'Mínimo 6 caracteres'); hasError = true; }
        if (password !== confirmPassword) { showInlineError('reg-password-confirm', 'Las contraseñas no coinciden'); hasError = true; }

        if (hasError) return;

        setLoading('register', true);
        try {
            await apiFetch('/api/auth/registro', {
                method: 'POST',
                body: JSON.stringify({ nombre, email, password })
            });
            
            // Éxito: Limpiar formulario y pasar a Login
            registerForm.reset();
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            switchTab('login');
        } catch (error) {
            showInlineError('reg-email', error.message);
        } finally {
            setLoading('register', false);
        }
    });

    // --- Inicio de Sesión ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetErrors();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validaciones
        let hasError = false;
        if (!validateEmail(email)) { showInlineError('email', 'Email no válido'); hasError = true; }
        if (!password) { showInlineError('password', 'La contraseña es obligatoria'); hasError = true; }

        if (hasError) return;

        setLoading('login', true);
        try {
            // 1. POST /api/auth/login
            const response = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            // 2. Extraer datos (basado en Swagger verificado: response.data.token)
            const token = response.data.token;
            const nombre = response.data.nombre;
            
            // 3. Obtener Workspace (del array retornado en el login o vía GET if needed)
            // Según Swagger, el login ya trae 'workspaces: [...]'
            let workspaceId = null;
            if (response.data.workspaces && response.data.workspaces.length > 0) {
                workspaceId = response.data.workspaces[0].id;
            } else {
                // Fallback: Llamar a listar workspaces si no viene en el login
                const wsResponse = await apiFetch('/api/workspaces', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (wsResponse.length > 0) workspaceId = wsResponse[0].id;
            }

            if (!workspaceId) {
                throw new Error('No se encontró un workspace asociado a este usuario.');
            }

            // 4. Guardar Sesión
            saveSession(token, workspaceId, nombre);

            // 5. Redirigir
            window.location.href = './dashboard.html';

        } catch (error) {
            showInlineError('email', error.message);
        } finally {
            setLoading('login', false);
        }
    });

    // --- Utilidades de UI ---
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showInlineError(inputId, message) {
        const errorSpan = document.getElementById(`error-${inputId}`);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.classList.remove('hidden');
        }
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.add('border-error');
        }
    }

    function resetErrors() {
        document.querySelectorAll('[id^="error-"]').forEach(span => {
            span.classList.add('hidden');
            span.textContent = '';
        });
        document.querySelectorAll('input').forEach(input => {
            input.classList.remove('border-error');
        });
    }

    function setLoading(mode, isLoading) {
        const btn = mode === 'login' ? document.getElementById('btn-login') : document.getElementById('btn-register');
        const span = btn.querySelector('span:first-child');
        
        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed');
            span.textContent = 'Cargando...';
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
            span.textContent = mode === 'login' ? 'Entrar' : 'Crear Cuenta';
        }
    }
});
