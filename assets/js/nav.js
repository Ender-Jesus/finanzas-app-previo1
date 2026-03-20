document.addEventListener('DOMContentLoaded', () => {
    // --- Resaltar Menú Activo ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a, aside nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Usamos endsWith para manejar subcarpetas o rutas relativas
        if (href && (currentPath.endsWith(href) || (currentPath === '/' && href === 'dashboard.html'))) {
            // Estilo para links en Top Navigation (Desktop)
            if (link.closest('header')) {
                link.classList.add('text-emerald-700', 'dark:text-emerald-400', 'font-semibold', 'border-b-2', 'border-emerald-600', 'pb-1');
                link.classList.remove('text-slate-500', 'dark:text-slate-400');
            }
            // Estilo para links en Side Navigation (Desktop/Mobile)
            if (link.closest('aside') || link.closest('#mobile-sidebar')) {
                link.classList.add('bg-emerald-50', 'dark:bg-emerald-900/20', 'text-emerald-700', 'dark:text-emerald-300', 'font-bold');
                link.classList.remove('text-slate-500', 'dark:text-slate-400');
            }
        }
    });

    // --- Menú Móvil (Hamburger) ---
    const btnMenu = document.getElementById('btn-mobile-menu');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const btnCloseMobile = document.getElementById('btn-close-mobile');

    if (btnMenu && mobileSidebar) {
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileSidebar.classList.remove('-translate-x-full');
        });

        if (btnCloseMobile) {
            btnCloseMobile.addEventListener('click', () => {
                mobileSidebar.classList.add('-translate-x-full');
            });
        }

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!mobileSidebar.contains(e.target) && !btnMenu.contains(e.target)) {
                mobileSidebar.classList.add('-translate-x-full');
            }
        });
    }

    // --- Logout Global ---
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof clearSession === 'function') {
                clearSession();
            } else {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
});
