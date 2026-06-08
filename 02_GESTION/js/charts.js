/* ==========================================================================
   APP5T_Charts  –  Dashboard KPIs & Charts (Chart.js)
   5 Tierras CRM & GIS
   ========================================================================== */

const APP5T_Charts = (function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────────
    let compositionChart = null;
    let projectsChart    = null;
    let velocityChart    = null;
    let goalsChart       = null;

    // ── Status colours (mirrors map.js) ────────────────────────────────────
    const COLORS = {
        'Disponible': '#2ecc71',
        'Pendiente':  '#f1c40f',
        'Reservada':  '#f39c12',
        'Promesada':  '#3498db',
        'Vendida':    '#e74c3c'
    };

    // ── KPI icon map ───────────────────────────────────────────────────────
    const KPI_ICONS = {
        leads:            'fa-solid fa-users',
        reservasEnviadas: 'fa-solid fa-paper-plane',
        reservasAprobadas:'fa-solid fa-circle-check',
        comision:         'fa-solid fa-coins',
        ingresoTotal:     'fa-solid fa-chart-line',
        promesas:         'fa-solid fa-handshake',
        caja:             'fa-solid fa-vault',
        lotesVendidos:    'fa-solid fa-house-circle-check',
        cuotasPendientes: 'fa-solid fa-clock',
        montoPendiente:   'fa-solid fa-file-invoice-dollar',
        montoRecaudado:   'fa-solid fa-sack-dollar',
        promesasActivas:  'fa-solid fa-file-signature'
    };

    // ── Helper: build a single KPI card HTML ───────────────────────────────
    function _kpiCard(icon, label, value) {
        return (
            '<div class="kpi-card">' +
                '<div class="kpi-icon"><i class="' + icon + '"></i></div>' +
                '<div class="kpi-body">' +
                    '<span class="kpi-label">' + label.toUpperCase() + '</span>' +
                    '<span class="kpi-value">' + value + '</span>' +
                '</div>' +
            '</div>'
        );
    }

    // ── Render KPIs by role ────────────────────────────────────────────────
    function _renderKPIs(stats, role) {
        const container = document.getElementById('kpi-grid');
        if (!container) return;

        let html = '';

        if (role === 'vendedor') {
            // Leads Activos – count clientes assigned (approximate from propiedades)
            const leadsCount = stats.pendientes + stats.reservadas;
            html += _kpiCard(KPI_ICONS.leads, 'Leads Activos', leadsCount);

            // Reservas Enviadas
            html += _kpiCard(KPI_ICONS.reservasEnviadas, 'Reservas Enviadas', stats.pendientes);

            // Reservas Aprobadas
            html += _kpiCard(KPI_ICONS.reservasAprobadas, 'Reservas Aprobadas', stats.reservadas);

            // Comisión Estimada (3% of reservadas value)
            const reservadasProps = APP5T_DB.query('propiedades', function (p) {
                return p.estado === 'Reservada';
            });
            let sumReservadas = 0;
            reservadasProps.forEach(function (p) { sumReservadas += (p.valor_final || 0); });
            const comision = sumReservadas * 0.03;
            html += _kpiCard(KPI_ICONS.comision, 'Comisión Estimada', APP5T_Utils.formatMoneda(comision));

        } else if (role === 'gerente') {
            html += _kpiCard(KPI_ICONS.ingresoTotal, 'Ingreso Total Proyectado', APP5T_Utils.formatMoneda(stats.ingresoProyectado || stats.ingresoTotal));
            html += _kpiCard(KPI_ICONS.promesas, 'Dinero en Promesas', APP5T_Utils.formatMoneda(stats.ingresoComprometido));
            html += _kpiCard(KPI_ICONS.caja, 'Caja Recaudada', APP5T_Utils.formatMoneda(stats.ingresoRecaudado));
            html += _kpiCard(KPI_ICONS.lotesVendidos, 'Lotes Vendidos', stats.vendidas + ' / ' + stats.totales);

        } else if (role === 'administrador') {
            html += _kpiCard(KPI_ICONS.cuotasPendientes, 'Cuotas Pendientes', stats.cuotasPendientes || 0);
            html += _kpiCard(KPI_ICONS.montoPendiente, 'Monto Pendiente Cuotas', APP5T_Utils.formatMoneda(stats.montoPendienteCuotas || 0));
            html += _kpiCard(KPI_ICONS.montoRecaudado, 'Monto Recaudado Cuotas', APP5T_Utils.formatMoneda(stats.montoRecaudadoCuotas || 0));
            html += _kpiCard(KPI_ICONS.promesasActivas, 'Promesas Activas', stats.promesadas || 0);
        }

        container.innerHTML = html;
    }

    // ── Chart.js centre-text plugin (doughnut) ─────────────────────────────
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: function (chart) {
            if (chart.config.type !== 'doughnut') return;

            const total = chart.config.data.datasets[0].data.reduce(function (a, b) { return a + b; }, 0);
            const ctx = chart.ctx;
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

            ctx.save();
            ctx.font = 'bold 28px "Inter", "Segoe UI", sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total, centerX, centerY - 10);

            ctx.font = '12px "Inter", "Segoe UI", sans-serif';
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
            ctx.fillText('TOTAL LOTES', centerX, centerY + 14);
            ctx.restore();
        }
    };

    // ── Render Composition Doughnut ────────────────────────────────────────
    function _renderCompositionChart(stats) {
        const canvas = document.getElementById('chart-composition');
        if (!canvas) return;

        if (compositionChart) {
            compositionChart.destroy();
            compositionChart = null;
        }

        const ctx = canvas.getContext('2d');

        compositionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'Pendiente', 'Reservada', 'Promesada', 'Vendida'],
                datasets: [{
                    data: [
                        stats.disponibles || 0,
                        stats.pendientes  || 0,
                        stats.reservadas  || 0,
                        stats.promesadas  || 0,
                        stats.vendidas    || 0
                    ],
                    backgroundColor: [
                        COLORS['Disponible'],
                        COLORS['Pendiente'],
                        COLORS['Reservada'],
                        COLORS['Promesada'],
                        COLORS['Vendida']
                    ],
                    borderColor: 'rgba(0,0,0,0.3)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            plugins: [centerTextPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#1e293b',
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 12, family: '"Inter", "Segoe UI", sans-serif' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,15,25,0.92)',
                        titleColor: '#ffffff',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return ' ' + context.label + ': ' + context.parsed + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // ── Render Projects Stacked Bar ────────────────────────────────────────
    function _renderProjectsChart(stats) {
        const canvas = document.getElementById('chart-projects');
        if (!canvas) return;

        if (projectsChart) {
            projectsChart.destroy();
            projectsChart = null;
        }

        const perProject = stats.perProject || {};
        const projectNames = Object.keys(perProject);

        // Build dataset arrays (include Pendiente)
        const statuses = ['Disponible', 'Pendiente', 'Reservada', 'Promesada', 'Vendida'];
        const statusKeys = { 
            'Disponible': 'disponibles', 
            'Pendiente':  'pendientes', 
            'Reservada':  'reservadas', 
            'Promesada':  'promesadas', 
            'Vendida':    'vendidas' 
        };

        const datasets = statuses.map(function (status) {
            return {
                label: status,
                data: projectNames.map(function (name) {
                    var p = perProject[name];
                    return p ? (p[statusKeys[status]] || 0) : 0;
                }),
                backgroundColor: COLORS[status],
                borderColor: 'rgba(0,0,0,0.2)',
                borderWidth: 1,
                borderRadius: 4
            };
        });

        const ctx = canvas.getContext('2d');

        projectsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: projectNames,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: 'rgba(15, 23, 42, 0.7)',
                            font: { size: 11, family: '"Inter", "Segoe UI", sans-serif' }
                        },
                        grid: {
                            color: 'rgba(15, 23, 42, 0.05)',
                            drawBorder: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(15, 23, 42, 0.7)',
                            stepSize: 5,
                            font: { size: 11, family: '"Inter", "Segoe UI", sans-serif' }
                        },
                        grid: {
                            color: 'rgba(15, 23, 42, 0.05)',
                            drawBorder: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#1e293b',
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 12, family: '"Inter", "Segoe UI", sans-serif' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,15,25,0.92)',
                        titleColor: '#ffffff',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                }
            }
        });
    }

    // ── Render Velocity Line Chart ─────────────────────────────────────────
    function _renderVelocityChart(stats) {
        const canvas = document.getElementById('chart-velocity');
        if (!canvas) return;
        if (velocityChart) { velocityChart.destroy(); velocityChart = null; }

        // Mock data based on stats.ingresoRecaudado or random curve if 0
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const base = (stats.ingresoRecaudado || 50000000) / 6;
        const data = months.map((m, i) => base * (1 + (Math.random() * 0.5)));

        const ctx = canvas.getContext('2d');
        velocityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Recaudación Mensual',
                    data: data,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#3498db',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: 'rgba(15, 23, 42, 0.7)' }, grid: { display: false } },
                    y: { ticks: { color: 'rgba(15, 23, 42, 0.7)', callback: function(value) { return '$' + (value/1000000) + 'M'; } }, grid: { color: 'rgba(15, 23, 42, 0.05)' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(15,15,25,0.92)' }
                }
            }
        });
    }

    // ── Render Goals Doughnut (Gauge) ──────────────────────────────────────
    function _renderGoalsChart(stats) {
        const canvas = document.getElementById('chart-goals');
        if (!canvas) return;
        if (goalsChart) { goalsChart.destroy(); goalsChart = null; }

        const meta = 500000000; // Meta anual fija 500M (ejemplo)
        const logrado = stats.ingresoRecaudado || 0;
        const porcentaje = Math.min((logrado / meta) * 100, 100).toFixed(1);
        const restante = Math.max(meta - logrado, 0);

        const centerProgressPlugin = {
            id: 'centerProgressText',
            beforeDraw: function(chart) {
                if (chart.config.type !== 'doughnut') return;
                const ctx = chart.ctx;
                const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                ctx.save();
                ctx.font = 'bold 24px "Inter", sans-serif';
                ctx.fillStyle = '#0f172a';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(porcentaje + '%', centerX, centerY);
                ctx.restore();
            }
        };

        const ctx = canvas.getContext('2d');
        goalsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Logrado', 'Restante'],
                datasets: [{
                    data: [logrado, restante],
                    backgroundColor: ['#f1c40f', 'rgba(15, 23, 42, 0.08)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            plugins: [centerProgressPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return ' ' + context.label + ': ' + APP5T_Utils.formatMoneda(context.parsed); }
                        }
                    }
                }
            }
        });
    }

    // ── Helper: Render offline warning when Chart.js is missing ────────────
    function _renderOfflineWarning() {
        const ids = ['chart-composition', 'chart-projects', 'chart-velocity', 'chart-goals'];
        ids.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.style.display = 'none';
                    let warn = parent.querySelector('.chart-offline-warning');
                    if (!warn) {
                        warn = document.createElement('div');
                        warn.className = 'chart-offline-warning';
                        warn.style.cssText = 'color:var(--text-dim);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:150px;font-size:13px;gap:8px;padding:20px;text-align:center;';
                        warn.innerHTML = '<i class="fa-solid fa-cloud-slash" style="font-size:24px;color:var(--primary);opacity:0.7;"></i><span>Gráficos no disponibles (sin conexión)</span>';
                        parent.appendChild(warn);
                    }
                }
            }
        });
    }

    // ── Public: renderDashboard ────────────────────────────────────────────
    function renderDashboard(role) {
        const stats = APP5T_DB.getStats();
        _renderKPIs(stats, role);

        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Showing offline fallback.');
            _renderOfflineWarning();
            return;
        }

        // Make sure canvas elements are visible if Chart is available
        const ids = ['chart-composition', 'chart-projects', 'chart-velocity', 'chart-goals'];
        ids.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                canvas.style.display = '';
                const warn = canvas.parentElement ? canvas.parentElement.querySelector('.chart-offline-warning') : null;
                if (warn) warn.remove();
            }
        });

        _renderCompositionChart(stats);
        _renderProjectsChart(stats);
        _renderVelocityChart(stats);
        _renderGoalsChart(stats);
    }

    // ── Public: destroy ────────────────────────────────────────────────────
    function destroy() {
        if (compositionChart) {
            compositionChart.destroy();
            compositionChart = null;
        }
        if (projectsChart) {
            projectsChart.destroy();
            projectsChart = null;
        }
        if (velocityChart) {
            velocityChart.destroy();
            velocityChart = null;
        }
        if (goalsChart) {
            goalsChart.destroy();
            goalsChart = null;
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────
    return {
        renderDashboard: renderDashboard,
        destroy:         destroy
    };

})();
