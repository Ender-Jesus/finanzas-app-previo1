document.addEventListener('DOMContentLoaded', () => {
    // --- Proteger Ruta ---
    checkAuth();

    // --- Elementos del DOM ---
    const userNameDisplay = document.getElementById('user-name-display');
    const formBeneficiario = document.getElementById('form-beneficiario');
    const containerBeneficiarios = document.getElementById('container-beneficiarios');
    const emptyState = document.getElementById('empty-state');
    const benCount = document.getElementById('ben-count');
    
    // Modal
    const modalDelete = document.getElementById('modal-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    let beneficiaryToDelete = null;

    // --- Inicialización ---
    userNameDisplay.textContent = getUserName() || 'Usuario';
    loadBeneficiaries();

    // --- Eventos ---
    formBeneficiario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('ben-nombre').value.trim();
        const descripcion = document.getElementById('ben-descripcion').value.trim();
        const workspaceId = getWorkspaceId();

        if (!nombre) return;

        setLoading(true);
        try {
            await apiFetch('/api/beneficiarios', {
                method: 'POST',
                body: JSON.stringify({ nombre, descripcion, workspaceId })
            });
            formBeneficiario.reset();
            showToast('Beneficiario creado', 'success');
            loadBeneficiaries();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    });

    // Cerrar modal
    btnCancelDelete.addEventListener('click', () => {
        modalDelete.classList.add('hidden');
        beneficiaryToDelete = null;
    });

    // Confirmar eliminación
    btnConfirmDelete.addEventListener('click', async () => {
        if (!beneficiaryToDelete) return;

        try {
            await apiFetch(`/api/beneficiarios/${beneficiaryToDelete}`, {
                method: 'DELETE'
            });
            modalDelete.classList.add('hidden');
            beneficiaryToDelete = null;
            showToast('Beneficiario eliminado', 'success');
            loadBeneficiaries();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // --- Funciones Core ---
    async function loadBeneficiaries() {
        const workspaceId = getWorkspaceId();
        containerBeneficiarios.classList.add('loading');
        try {
            const response = await apiFetch(`/api/beneficiarios?workspaceId=${workspaceId}`);
            renderBeneficiaries(response.data || []);
        } catch (error) {
            showToast('Error al cargar beneficiarios', 'error');
            renderBeneficiaries([]);
        } finally {
            containerBeneficiarios.classList.remove('loading');
        }
    }

    function renderBeneficiaries(beneficiaries) {
        benCount.textContent = `${beneficiaries.length} Beneficiario${beneficiaries.length !== 1 ? 's' : ''}`;

        if (beneficiaries.length === 0) {
            containerBeneficiarios.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        containerBeneficiarios.classList.remove('hidden');
        emptyState.classList.add('hidden');

        containerBeneficiarios.innerHTML = beneficiaries.map(ben => `
            <div class="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col relative">
                <div class="h-12 w-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container mb-4">
                    <span class="material-symbols-outlined text-2xl">person</span>
                </div>
                <h4 class="font-bold text-on-secondary-fixed text-lg">${ben.nombre}</h4>
                <p class="text-on-surface-variant text-sm mt-1">${ben.descripcion || 'Sin descripción'}</p>
                <div class="mt-6 pt-4 border-t border-slate-50 flex justify-end items-center">
                    <button class="text-error hover:bg-error-container/20 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100 btn-delete" data-id="${ben.id}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Agregar listeners a botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                beneficiaryToDelete = btn.dataset.id;
                modalDelete.classList.remove('hidden');
            });
        });
    }

    function setLoading(isLoading) {
        const btn = document.getElementById('btn-add-ben');
        const btnText = btn.querySelector('span:not(.material-symbols-outlined)');
        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('opacity-70');
            if (btnText) btnText.textContent = 'Guardando...';
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-70');
            if (btnText) btnText.textContent = 'Agregar...';
        }
    }
});
