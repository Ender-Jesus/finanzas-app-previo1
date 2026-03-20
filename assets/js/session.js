/**
 * Guarda los datos de la sesión en el almacenamiento de la sesión del navegador.
 * @param {string} token - JWT retornado por la API.
 * @param {number|string} workspaceId - ID del espacio de trabajo activo.
 * @param {string} userName - Nombre del usuario logueado.
 */
function saveSession(token, workspaceId, userName) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('workspaceId', workspaceId);
    sessionStorage.setItem('userName', userName);
}

/**
 * Retorna el token de la sesión actual.
 * @returns {string|null}
 */
function getToken() {
    return sessionStorage.getItem('token');
}

/**
 * Retorna el ID del workspace de la sesión actual.
 * @returns {string|null}
 */
function getWorkspaceId() {
    return sessionStorage.getItem('workspaceId');
}

/**
 * Retorna el nombre del usuario de la sesión actual.
 * @returns {string|null}
 */
function getUserName() {
    return sessionStorage.getItem('userName');
}

/**
 * Limpia todos los datos de sesión y redirige al login.
 */
function clearSession() {
    sessionStorage.clear();
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = './login.html';
    } else {
        window.location.href = './pages/login.html';
    }
}

/**
 * Verifica si existe una sesión activa. Si no, redirige al login.
 * Debe llamarse al inicio de cada página protegida.
 */
function checkAuth() {
    if (!getToken()) {
        clearSession();
    }
}
