const BASE_URL = 'https://finanzas-api.ubunifusoft.digital';

/**
 * Obtiene los headers necesarios para las peticiones a la API.
 * Incluye Content-Type y el token de autorización si está disponible.
 * @returns {Object} Headers de la petición.
 */
function getHeaders() {
    const token = sessionStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Wrapper de fetch para centralizar la lógica de peticiones a la API.
 * Maneja automáticamente la BASE_URL, los headers y errores comunes.
 * @param {string} endpoint - El endpoint a consultar (ej: '/api/auth/login').
 * @param {Object} options - Opciones de fetch (method, body, etc).
 * @returns {Promise<Object>} Promesa con los datos de respuesta.
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Mezclar opciones por defecto con las proporcionadas
    const config = {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        
        // Manejo específico de error de sesión expirada o no autorizada
        if (response.status === 401) {
            sessionStorage.clear();
            // Determinamos la ruta dependiendo de dónde estemos (raíz o carpetas)
            if (window.location.pathname.includes('/pages/')) {
                window.location.href = './login.html';
            } else {
                window.location.href = './pages/login.html';
            }
            return;
        }

        const data = await response.json();

        // Si la respuesta no es exitosa, lanzar error con el mensaje de la API
        if (!response.ok) {
            throw new Error(data.mensaje || data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
