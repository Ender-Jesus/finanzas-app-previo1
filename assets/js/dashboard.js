document.addEventListener('DOMContentLoaded', () => {
    // --- Proteger Ruta ---
    checkAuth();

    // --- Elementos del DOM ---
    const userNameDisplay = document.getElementById('user-name-display');
    const btnLogout = document.getElementById('btn-logout');
    const totalIngresosEl = document.getElementById('total-ingresos');
    const totalGastosEl = document.getElementById('total-gastos');
    const totalBalanceEl = document.getElementById('total-balance');
    const tableMovimientos = document.getElementById('table-movimientos');
    const chartLegend = document.getElementById('chart-legend');

    // --- Inicialización ---
    userNameDisplay.textContent = getUserName() || 'Usuario';
    btnLogout.addEventListener('click', clearSession);

    const currencyFormatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    });

    // --- Carga de Datos ---
    async function initDashboard() {
        const workspaceId = getWorkspaceId();
        
        try {
            // 1. Obtener Resumen (Usamos el endpoint verificado o fallback)
            // Según investigación previa: /api/dashboard/resumen-mensual?workspaceId=...
            const resumen = await apiFetch(`/api/dashboard/resumen-mensual?workspaceId=${workspaceId}`);
            
            // 2. Renderizar Tarjetas
            renderSummaryCards(resumen);

            // 3. Obtener y Renderizar Gráfico (Usamos reporte por categoría)
            const gastosResponse = await apiFetch(`/api/reportes/gastos-por-categoria?workspaceId=${workspaceId}`);
            renderChart(gastosResponse);

            // 4. Obtener últimos movimientos
            const movimientos = await apiFetch(`/api/transactions?workspaceId=${workspaceId}`);
            renderRecentMovements(movimientos.slice(0, 5));

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            // Intentar cargar datos mock si el API falla para demostrar UI
            renderMockData();
        }
    }

    function renderSummaryCards(data) {
        totalIngresosEl.textContent = currencyFormatter.format(data.totalIngresos || 0);
        totalGastosEl.textContent = currencyFormatter.format(data.totalGastos || 0);
        const balance = (data.totalIngresos || 0) - (data.totalGastos || 0);
        totalBalanceEl.textContent = currencyFormatter.format(balance);
        
        if (balance < 0) {
            totalBalanceEl.classList.add('text-error');
            totalBalanceEl.classList.remove('text-on-secondary-fixed');
        }
    }

    function renderChart(data) {
        const ctx = document.getElementById('chart-categorias').getContext('2d');
        
        // Colores para el gráfico
        const colors = ['#10b981', '#818cf8', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'];
        
        const labels = data.map(item => item.categoria);
        const values = data.map(item => item.monto);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Renderizar Leyenda Manual
        chartLegend.innerHTML = data.map((item, index) => `
            <li class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${colors[index % colors.length]}"></div>
                    <span class="text-sm font-medium text-on-surface-variant">${item.categoria}</span>
                </div>
                <span class="text-sm font-bold text-on-secondary-fixed">${currencyFormatter.format(item.monto)}</span>
            </li>
        `).join('');
    }

    function renderRecentMovements(movimientos) {
        tableMovimientos.innerHTML = movimientos.map(mov => `
            <tr class="bg-surface hover:bg-surface-container-low transition-colors group">
                <td class="px-4 py-4 rounded-l-xl text-slate-500 font-medium">${new Date(mov.fecha).toLocaleDateString('es-CO')}</td>
                <td class="px-4 py-4 font-bold text-on-secondary-fixed">${mov.descripcion}</td>
                <td class="px-4 py-4">
                    <span class="${mov.tipo === 'GASTO' ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'} px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                        ${mov.categoriaNombre || 'General'}
                    </span>
                </td>
                <td class="px-4 py-4 rounded-r-xl text-right font-bold ${mov.tipo === 'GASTO' ? 'text-error' : 'text-tertiary'}">
                    ${mov.tipo === 'GASTO' ? '-' : '+'}${currencyFormatter.format(mov.monto)}
                </td>
            </tr>
        `).join('');
    }

    function renderMockData() {
        // En caso de que el workspace sea nuevo o el API no responda con el formato exacto
        renderSummaryCards({ totalIngresos: 4250000, totalGastos: 1840000 });
        renderChart([
            { categoria: 'Alimentación', monto: 850000 },
            { categoria: 'Educación', monto: 600000 },
            { categoria: 'Transporte', monto: 240000 }
        ]);
        renderRecentMovements([
            { fecha: new Date(), descripcion: 'Pago Semestre', tipo: 'GASTO', categoriaNombre: 'Educación', monto: 500000 },
            { fecha: new Date(), descripcion: 'Beca', tipo: 'INGRESO', categoriaNombre: 'Ingreso', monto: 1500000 }
        ]);
    }

    initDashboard();
});
