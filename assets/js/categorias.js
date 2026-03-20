document.addEventListener('DOMContentLoaded', () => {
    // --- Proteger Ruta ---
    checkAuth();

    // --- Elementos del DOM ---
    const userNameDisplay = document.getElementById('user-name-display');
    const formCategoria = document.getElementById('form-categoria');
    const tableCategorias = document.getElementById('table-categorias');
    const containerTable = document.getElementById('container-table');
    const emptyState = document.getElementById('empty-state');
    const catCount = document.getElementById('cat-count');
    
    // Modal
    const modalDelete = document.getElementById('modal-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    let categoryToDelete = null;

    // --- Inicialización ---
    userNameDisplay.textContent = getUserName() || 'Usuario';
    loadCategories();

    // --- Eventos ---
    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('cat-nombre').value.trim();
        const tipo = document.getElementById('cat-tipo').value;
        const workspaceId = getWorkspaceId();

        if (!nombre || !tipo) return;

        setLoading(true);
        try {
            await apiFetch('/api/categorias', {
                method: 'POST',
                body: JSON.stringify({ nombre, tipo, workspaceId })
            });
            formCategoria.reset();
            loadCategories();
        } catch (error) {
            alert('Error al crear categoría: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    // Cerrar modal
    btnCancelDelete.addEventListener('click', () => {
        modalDelete.classList.add('hidden');
        categoryToDelete = null;
    });

    // Confirmar eliminación
    btnConfirmDelete.addEventListener('click', async () => {
        if (!categoryToDelete) return;

        try {
            await apiFetch(`/api/categorias/${categoryToDelete}`, {
                method: 'DELETE'
            });
            modalDelete.classList.add('hidden');
            categoryToDelete = null;
            loadCategories();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    });

    // --- Funciones Core ---
    async function loadCategories() {
        const workspaceId = getWorkspaceId();
        try {
            const categories = await apiFetch(`/api/categorias?workspaceId=${workspaceId}`);
            renderCategories(categories);
        } catch (error) {
            console.error('Error cargando categorías:', error);
            renderCategories([]); // Mostrar estado vacío si hay error
        }
    }

    function renderCategories(categories) {
        catCount.textContent = `${categories.length} Categoría${categories.length !== 1 ? 's' : ''}`;

        if (categories.length === 0) {
            containerTable.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        containerTable.classList.remove('hidden');
        emptyState.classList.add('hidden');

        tableCategorias.innerHTML = categories.map(cat => `
            <tr class="group hover:bg-surface-container-low transition-colors duration-200">
                <td class="px-8 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg ${cat.tipo === 'INGRESO' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'} flex items-center justify-center">
                            <span class="material-symbols-outlined text-lg">
                                ${cat.tipo === 'INGRESO' ? 'add_circle' : 'do_not_disturb_on'}
                            </span>
                        </div>
                        <span class="font-semibold text-on-surface">${cat.nombre}</span>
                    </div>
                </td>
                <td class="px-8 py-5">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${
                        cat.tipo === 'INGRESO' 
                        ? 'bg-tertiary-container/20 text-on-tertiary-fixed-variant' 
                        : 'bg-error-container text-on-error-container'
                    }">
                        ${cat.tipo}
                    </span>
                </td>
                <td class="px-8 py-5 text-right">
                    <button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all btn-delete" data-id="${cat.id}">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </td>
            </tr>
        `).join('');

        // Agregar listeners a botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                categoryToDelete = btn.dataset.id;
                modalDelete.classList.remove('hidden');
            });
        });
    }

    function setLoading(isLoading) {
        const btn = document.getElementById('btn-add-cat');
        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('opacity-70');
            btn.querySelector('span:last-child').textContent = 'Guardando...';
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-70');
            btn.querySelector('span:last-child').textContent = 'Guardar';
        }
    }
});
