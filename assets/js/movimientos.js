document.addEventListener('DOMContentLoaded', () => {
    // --- Proteger Ruta ---
    checkAuth();

    // --- Elementos del DOM ---
    const userNameDisplay = document.getElementById('user-name-display');
    const formMovimiento = document.getElementById('form-movimiento');
    const selCategoria = document.getElementById('mov-categoria');
    const selBeneficiario = document.getElementById('mov-beneficiario');
    const bannerNoCategorias = document.getElementById('banner-no-categorias');
    const btnSaveMov = document.getElementById('btn-save-mov');
    const badgeTipoContainer = document.getElementById('badge-tipo-container');
    const badgeTipo = document.getElementById('badge-tipo');
    const tableMovimientos = document.getElementById('table-movimientos');
    const saldoEl = document.getElementById('saldo-disponible');
    
    // Filtros
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterDateStart = document.getElementById('filter-date-start');
    const filterDateEnd = document.getElementById('filter-date-end');

    // Variables de Estado
    let allCategories = [];
    let allMovements = [];
    let currentFilterType = 'ALL';

    const currencyFormatter = new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0
    });

    // --- Inicialización ---
    userNameDisplay.textContent = getUserName() || 'Usuario';
    document.getElementById('mov-fecha').valueAsDate = new Date();
    loadDependencies();

    // --- Eventos ---
    
    // Detección automática de tipo al cambiar categoría
    selCategoria.addEventListener('change', () => {
        const catId = selCategoria.value;
        const categoria = allCategories.find(c => c.id == catId);
        
        if (categoria) {
            badgeTipoContainer.classList.remove('hidden');
            badgeTipo.textContent = categoria.tipo;
            if (categoria.tipo === 'INGRESO') {
                badgeTipo.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-tertiary/10 text-tertiary';
            } else {
                badgeTipo.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-error/10 text-error';
            }
        } else {
            badgeTipoContainer.classList.add('hidden');
        }
    });

    // Envío de Formulario
    formMovimiento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const descripcion = document.getElementById('mov-descripcion').value.trim();
        const valor = parseFloat(document.getElementById('mov-valor').value);
        const fecha = document.getElementById('mov-fecha').value;
        const categoriaId = selCategoria.value;
        const beneficiarioId = selBeneficiario.value || null;
        const workspaceId = getWorkspaceId();

        if (!descripcion || isNaN(valor) || valor <= 0 || !fecha || !categoriaId) {
            showToast('Por favor completa todos los campos correctamente.', 'error');
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({ 
                    descripcion, 
                    monto: valor, 
                    fecha: new Date(fecha).toISOString(), 
                    categoriaId, 
                    beneficiarioId, 
                    workspaceId 
                })
            });
            formMovimiento.reset();
            document.getElementById('mov-fecha').valueAsDate = new Date();
            badgeTipoContainer.classList.add('hidden');
            showToast('Movimiento registrado', 'success');
            loadMovements(); // Recargar lista
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    });

    // Filtros de Tipo
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-white', 'shadow-sm', 'font-bold');
                b.classList.add('text-on-surface-variant');
            });
            btn.classList.add('bg-white', 'shadow-sm', 'font-bold');
            btn.classList.remove('text-on-surface-variant');
            currentFilterType = btn.dataset.type;
            applyFilters();
        });
    });

    // Filtros de Fecha
    [filterDateStart, filterDateEnd].forEach(input => {
        input.addEventListener('change', applyFilters);
    });

    // --- Funciones Core ---

    async function loadDependencies() {
        const workspaceId = getWorkspaceId();
        try {
            const [categories, beneficiaries] = await Promise.all([
                apiFetch(`/api/categorias?workspaceId=${workspaceId}`),
                apiFetch(`/api/beneficiarios?workspaceId=${workspaceId}`)
            ]);

            allCategories = categories;
            
            // Poblar Categorías
            if (categories.length === 0) {
                bannerNoCategorias.classList.remove('hidden');
                selCategoria.disabled = true;
                btnSaveMov.disabled = true;
                btnSaveMov.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                selCategoria.innerHTML = '<option value="">Seleccionar categoría...</option>' + 
                    categories.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            }

            // Poblar Beneficiarios
            selBeneficiario.innerHTML = '<option value="">Seleccionar beneficiario (opcional)...</option>' + 
                beneficiarios.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');

            loadMovements(); // Cargar movimientos tras cargar dependencias

        } catch (error) {
            showToast('Error cargando dependencias', 'error');
        }
    }

    async function loadMovements() {
        const workspaceId = getWorkspaceId();
        tableMovimientos.classList.add('loading');
        try {
            allMovements = await apiFetch(`/api/transactions?workspaceId=${workspaceId}`);
            calculateBalance();
            applyFilters();
        } catch (error) {
            showToast('Error cargando movimientos', 'error');
        } finally {
            tableMovimientos.classList.remove('loading');
        }
    }

    function calculateBalance() {
        const total = allMovements.reduce((acc, mov) => {
            return mov.tipo === 'INGRESO' ? acc + mov.monto : acc - mov.monto;
        }, 0);
        saldoEl.textContent = currencyFormatter.format(total);
        saldoEl.className = `text-4xl font-extrabold font-headline mb-6 ${total >= 0 ? 'text-emerald-400' : 'text-error'}`;
    }

    function applyFilters() {
        let filtered = allMovements;

        // Filtro Tipo
        if (currentFilterType !== 'ALL') {
            filtered = filtered.filter(m => m.tipo === currentFilterType);
        }

        // Filtro Fecha
        const start = filterDateStart.value;
        const end = filterDateEnd.value;
        if (start) {
            filtered = filtered.filter(m => new Date(m.fecha) >= new Date(start));
        }
        if (end) {
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59);
            filtered = filtered.filter(m => new Date(m.fecha) <= endDate);
        }

        renderMovements(filtered);
    }

    function renderMovements(movimientos) {
        tableMovimientos.innerHTML = movimientos.map(mov => `
            <tr class="group hover:bg-surface-container-low transition-colors">
                <td class="py-4 px-4 text-on-surface-variant font-medium">${new Date(mov.fecha).toLocaleDateString('es-CO')}</td>
                <td class="py-4 px-4 font-bold text-on-secondary-fixed">${mov.descripcion}</td>
                <td class="py-4 px-4">
                    <span class="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                        ${mov.categoriaNombre || 'Sin Cat.'}
                    </span>
                </td>
                <td class="py-4 px-4 text-right font-bold ${mov.tipo === 'INGRESO' ? 'text-tertiary' : 'text-error'}">
                    ${mov.tipo === 'INGRESO' ? '+' : '-'}${currencyFormatter.format(mov.monto)}
                </td>
            </tr>
        `).join('');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnSaveMov.disabled = true;
            btnSaveMov.classList.add('opacity-70');
            btnSaveMov.innerHTML = 'Guardando... <span class="material-symbols-outlined animate-spin">refresh</span>';
        } else {
            btnSaveMov.disabled = false;
            btnSaveMov.classList.remove('opacity-70');
            btnSaveMov.innerHTML = 'Registrar Movimiento <span class="material-symbols-outlined">save</span>';
        }
    }
});
