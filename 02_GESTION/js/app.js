/**
 * =====================================================
 * APP.JS — APP5T  (Main SPA Controller)
 * CRM & GIS Unificado — 5 Tierras
 * =====================================================
 */
const APP5T = (() => {
  'use strict';

  /* ══════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════ */
  let activeRole = 'vendedor';
  let activeTab = 'mapa';
  let isMobile = window.innerWidth < 768;
  let adminUnlocked = false;

  let activeGestionTab = {
    vendedor: 'leads',
    gerente: 'aprobaciones',
    administrador: 'mesa'
  };

  /* ══════════════════════════════════════════════════════
     MENU CONFIGURATION PER ROLE
     ══════════════════════════════════════════════════════ */
  const MENUS = {
    vendedor: [
      { id: 'mapa',       icon: 'fa-map-location-dot',  label: 'Mapa GIS' },
      { id: 'dashboard',  icon: 'fa-chart-line',        label: 'Dashboard' },
      { id: 'leads',      icon: 'fa-users',             label: 'Mis Leads' }
    ],
    gerente: [
      { id: 'mapa',        icon: 'fa-map-location-dot',     label: 'Mapa GIS' },
      { id: 'dashboard',   icon: 'fa-chart-line',           label: 'Panel Gerencial' },
      { id: 'aprobaciones', icon: 'fa-stamp',               label: 'Aprobaciones' },
      { id: 'precios',     icon: 'fa-tags',                 label: 'Control Precios' },
      { id: 'inventario',  icon: 'fa-list-check',           label: 'Inventario' },
      { id: 'auditoria',   icon: 'fa-clock-rotate-left',    label: 'Auditoría' }
    ],
    administrador: [
      { id: 'mapa',       icon: 'fa-map-location-dot',     label: 'Mapa GIS' },
      { id: 'dashboard',  icon: 'fa-chart-line',           label: 'Dashboard' },
      { id: 'mesa',       icon: 'fa-file-contract',        label: 'Mesa Documental' },
      { id: 'ctacte',     icon: 'fa-money-check-dollar',   label: 'Cuenta Corriente' },
      { id: 'carga',      icon: 'fa-database',             label: 'Carga de Datos' },
      { id: 'inventario', icon: 'fa-list-check',           label: 'Inventario' },
      { id: 'auditoria',  icon: 'fa-clock-rotate-left',    label: 'Auditoría' }
    ]
  };

  const ROLE_NAMES = {
    vendedor:      { name: 'Ricardo Comercial',  title: 'Fuerza de Ventas' },
    gerente:       { name: 'Ximena Guzmán',       title: 'Dirección Comercial' },
    administrador: { name: 'Claudio Documental',  title: 'Operación Legal' }
  };

  /* ══════════════════════════════════════════════════════
     STATUS BADGE HELPER
     ══════════════════════════════════════════════════════ */
  function getStatusBadgeHTML(estado) {
    const clean = (estado || '').toLowerCase().replace(/\s+/g, '-');
    return `<span class="tag tag-${clean}">${estado || '—'}</span>`;
  }

  /* ══════════════════════════════════════════════════════
     SIDEBAR & NAV
     ══════════════════════════════════════════════════════ */
  function _isTabVisible(role, tabId) {
    if (role === 'vendedor') {
      if (tabId === 'dashboard') {
        const el = document.getElementById('toggle-vendedor-kpis');
        return el ? el.checked : true;
      }
      if (tabId === 'mapa') {
        const el = document.getElementById('toggle-vendedor-mapa');
        return el ? el.checked : true;
      }
      if (tabId === 'leads') {
        const el = document.getElementById('toggle-vendedor-leads');
        return el ? el.checked : true;
      }
    }
    if (role === 'gerente') {
      if (tabId === 'dashboard') {
        const el = document.getElementById('toggle-gerente-dashboard');
        return el ? el.checked : true;
      }
      if (tabId === 'mapa') {
        const el = document.getElementById('toggle-gerente-charts');
        return el ? el.checked : true;
      }
      if (tabId === 'precios') {
        const el = document.getElementById('toggle-gerente-precios');
        return el ? el.checked : true;
      }
    }
    if (role === 'administrador') {
      if (tabId === 'mesa') {
        const el = document.getElementById('toggle-admin-mesa');
        return el ? el.checked : true;
      }
      if (tabId === 'ctacte') {
        const el = document.getElementById('toggle-admin-ctacte');
        return el ? el.checked : true;
      }
      if (tabId === 'carga') {
        const el = document.getElementById('toggle-admin-carga');
        return el ? el.checked : true;
      }
    }
    return true;
  }

  function _buildSidebar(role) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    let items = MENUS[role] || [];
    
    // Filter items based on toggles
    items = items.filter(m => _isTabVisible(role, m.id));

    // Append master admin menu if unlocked
    if (adminUnlocked) {
      items = items.concat([{ id: 'admin-general', icon: 'fa-gears', label: 'Admin. General' }]);
    }
    
    nav.innerHTML = items.map(m =>
      `<a href="#" class="nav-item${m.id === activeTab ? ' active' : ''}" data-tab="${m.id}">
        <i class="fa-solid ${m.icon}"></i>
        <span>${m.label}</span>
      </a>`
    ).join('');

    // Attach click listeners
    nav.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        switchTab(tabId);
      });
    });
  }

  function _updateUserInfo(role) {
    const info = ROLE_NAMES[role] || ROLE_NAMES.vendedor;
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = info.name;
    if (roleEl) roleEl.textContent = info.title;
  }

  function _updateBreadcrumb(tabId) {
    const bc = document.getElementById('breadcrumb-current');
    if (!bc) return;
    const items = MENUS[activeRole] || [];
    const found = items.find(m => m.id === tabId);
    bc.textContent = found ? found.label : (tabId === 'admin-general' ? 'Admin. General' : tabId);
  }

  /* ══════════════════════════════════════════════════════
     SWITCH ROLE
     ══════════════════════════════════════════════════════ */
  function switchRole(role) {
    if (!MENUS[role]) role = 'vendedor';
    activeRole = role;
    _updateUserInfo(role);
    _buildSidebar(role);

    // Sync role buttons active class
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-role') === role);
    });

    // Switch to first tab of the new role
    const firstTab = MENUS[role][0].id;
    switchTab(firstTab);

    refreshAll();
  }

  /* ══════════════════════════════════════════════════════
     SWITCH TAB
     ══════════════════════════════════════════════════════ */
  function switchTab(tabId) {
    // Hide all panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    // Show target panel
    const target = document.getElementById(`panel-${tabId}`);
    if (target) target.classList.add('active');

    // Update sidebar active state
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
    });

    _updateBreadcrumb(tabId);

    // Save active sub-tab for Gestion if applicable
    if (tabId !== 'mapa' && tabId !== 'dashboard' && tabId !== 'admin-general') {
      activeGestionTab[activeRole] = tabId;
    }

    activeTab = tabId;

    // Refresh mobile navigation highlights
    _buildMobileNav(activeRole);
    _buildMobileChips();

    // Close bottom sheet if not on map
    if (tabId !== 'mapa') {
      _closeBottomSheet();
    }

    // ── Special tab actions ──
    if (tabId === 'mapa') {
      setTimeout(() => {
        // Guard against Leaflet missing offline
        if (typeof L === 'undefined') {
          console.warn('Leaflet is not loaded. Map cannot be initialized.');
          const mapEl = document.getElementById('map-element');
          if (mapEl) {
            mapEl.style.display = 'flex';
            mapEl.style.alignItems = 'center';
            mapEl.style.justifyContent = 'center';
            mapEl.style.flexDirection = 'column';
            mapEl.style.background = 'var(--bg-hover)';
            mapEl.style.color = 'var(--text-dim)';
            mapEl.style.gap = '12px';
            mapEl.style.height = '100%';
            mapEl.innerHTML = '<i class="fa-solid fa-cloud-slash" style="font-size:32px;color:var(--primary);opacity:0.7;"></i><span>Mapa satelital no disponible (sin conexión)</span>';
          }
          return;
        }

        // Init map on first switch
        if (typeof APP5T_Map !== 'undefined' && !APP5T_Map._initialized) {
          APP5T_Map.init('map-element', onLoteSelected);
          APP5T_Map._initialized = true;
        }
        // Invalidate map size so tiles render properly
        if (typeof APP5T_Map !== 'undefined' && APP5T_Map._mapInstance) {
          APP5T_Map._mapInstance.invalidateSize();
        }
        // Load all projects simultaneously
        if (typeof APP5T_Map !== 'undefined') {
          APP5T_Map.loadAllProjects();
          const projSel = document.getElementById('map-project-select');
          if (projSel && projSel.value) {
            APP5T_Map.zoomToProject(projSel.value);
          }
        }
      }, 200);
    }

    if (tabId === 'dashboard') {
      if (typeof APP5T_Charts !== 'undefined') {
        APP5T_Charts.renderDashboard(activeRole);
      }
    }

    if (tabId === 'carga') {
      const crudContent = document.getElementById('crud-content');
      if (crudContent && typeof APP5T_Forms !== 'undefined') {
        // Activate the first CRUD tab by default
        const firstCrudTab = document.querySelector('.crud-tab.active');
        const entity = firstCrudTab ? firstCrudTab.getAttribute('data-entity') : 'vendedores';
        APP5T_Forms.renderCRUDTable(crudContent, entity || 'vendedores');
      }
    }

    // Close sidebar on mobile
    if (isMobile) {
      _closeSidebar();
    }

    activeTab = tabId;
  }

  /* ══════════════════════════════════════════════════════
     SIDEBAR TOGGLE (MOBILE)
     ══════════════════════════════════════════════════════ */
  function _openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
  }

  function _closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }

  /* ══════════════════════════════════════════════════════
     MODAL
     ══════════════════════════════════════════════════════ */
  function openModal(title, contentHTML) {
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (modalTitle) modalTitle.textContent = title || '';
    if (modalBody) modalBody.innerHTML = contentHTML || '';
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('visible');
    }
    // Reset dirty state on modal open
    window.APP5T_isFormDirty = false;
  }

  function closeModal(force = false) {
    const shouldConfirm = (force !== true) && window.APP5T_isFormDirty;
    if (shouldConfirm) {
      if (!confirm('Tiene cambios sin guardar en el formulario. ¿Está seguro de que desea salir?')) {
        return;
      }
    }
    const modal = document.getElementById('action-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('visible');
    }
    window.APP5T_isFormDirty = false;
  }

  /* ══════════════════════════════════════════════════════
     MOBILE BOTTOM SHEET
     ══════════════════════════════════════════════════════ */
  let _sheetState = 'collapsed'; // collapsed | half | full
  const SNAP_COLLAPSED = 140;
  const SNAP_HALF = Math.round(window.innerHeight * 0.5);
  const SNAP_FULL = Math.round(window.innerHeight * 0.85);

  function _initBottomSheet() {
    const handle = document.getElementById('bottom-sheet-handle');
    const sheet = document.getElementById('bottom-sheet');
    const closeBtn = document.getElementById('bottom-sheet-close');
    if (!sheet) return;

    let startY = 0;
    let startHeight = SNAP_COLLAPSED;

    if (handle) {
      handle.addEventListener('touchstart', e => {
        startY = e.touches[0].clientY;
        startHeight = sheet.offsetHeight;
        sheet.style.transition = 'none';
      }, { passive: true });

      handle.addEventListener('touchmove', e => {
        const dy = startY - e.touches[0].clientY;
        const newH = Math.max(SNAP_COLLAPSED, Math.min(SNAP_FULL, startHeight + dy));
        sheet.style.height = newH + 'px';
      }, { passive: true });

      handle.addEventListener('touchend', () => {
        sheet.style.transition = 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        const h = sheet.offsetHeight;
        // Snap to nearest point
        const dists = [
          { state: 'collapsed', dist: Math.abs(h - SNAP_COLLAPSED) },
          { state: 'half',      dist: Math.abs(h - SNAP_HALF) },
          { state: 'full',      dist: Math.abs(h - SNAP_FULL) }
        ];
        dists.sort((a, b) => a.dist - b.dist);
        _setSheetState(dists[0].state);
      });

      // Click toggles between collapsed and half
      handle.addEventListener('click', () => {
        if (_sheetState === 'collapsed') _setSheetState('half');
        else _setSheetState('collapsed');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.preventDefault();
        _closeBottomSheet();
      });
    }
  }

  function _closeBottomSheet() {
    const sheet = document.getElementById('bottom-sheet');
    if (!sheet) return;
    sheet.classList.remove('open', 'peek', 'expanded');
    sheet.classList.add('hidden');
    _sheetState = 'collapsed';

    // Deselect feature on map to match closed state
    if (typeof APP5T_Map !== 'undefined' && APP5T_Map._deselectPrevious) {
      try { APP5T_Map._deselectPrevious(); } catch(e) {}
    }
  }

  function _setSheetState(state) {
    const sheet = document.getElementById('bottom-sheet');
    if (!sheet) return;
    _sheetState = state;
    
    sheet.classList.remove('hidden');
    sheet.classList.add('open');

    sheet.classList.remove('peek', 'expanded');
    if (state === 'collapsed') {
      sheet.classList.add('peek');
    } else if (state === 'full') {
      sheet.classList.add('expanded');
    }

    const heights = { collapsed: SNAP_COLLAPSED, half: SNAP_HALF, full: SNAP_FULL };
    sheet.style.height = (heights[state] || SNAP_COLLAPSED) + 'px';
  }

  function _expandBottomSheet() {
    _setSheetState('half');
  }

  /* ══════════════════════════════════════════════════════
     MOBILE NAV BUILDERS
     ══════════════════════════════════════════════════════ */
  function _buildMobileNav(role) {
    const nav = document.getElementById('mobile-nav-bar');
    if (!nav) return;
    
    let html = '';
    if (role === 'vendedor') {
      html = `
        <a href="#" class="mobile-nav-item${activeTab === 'mapa' ? ' active' : ''}" data-tab="mapa">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Mapa GIS</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
          <i class="fa-solid fa-chart-line"></i>
          <span>Dashboard</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'leads' ? ' active' : ''}" data-tab="leads">
          <i class="fa-solid fa-users"></i>
          <span>Mis Leads</span>
        </a>
      `;
    } else if (role === 'gerente') {
      const isGestionActive = activeTab !== 'mapa' && activeTab !== 'dashboard' && activeTab !== 'admin-general';
      html = `
        <a href="#" class="mobile-nav-item${activeTab === 'mapa' ? ' active' : ''}" data-tab="mapa">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Mapa</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
          <i class="fa-solid fa-chart-line"></i>
          <span>Métricas</span>
        </a>
        <a href="#" class="mobile-nav-item${isGestionActive ? ' active' : ''}" data-tab="gestion">
          <i class="fa-solid fa-list-check"></i>
          <span>Gestión</span>
        </a>
      `;
    } else if (role === 'administrador') {
      const isGestionActive = activeTab !== 'mapa' && activeTab !== 'dashboard' && activeTab !== 'admin-general';
      html = `
        <a href="#" class="mobile-nav-item${activeTab === 'mapa' ? ' active' : ''}" data-tab="mapa">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Mapa</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
          <i class="fa-solid fa-chart-line"></i>
          <span>Métricas</span>
        </a>
        <a href="#" class="mobile-nav-item${isGestionActive ? ' active' : ''}" data-tab="gestion">
          <i class="fa-solid fa-file-contract"></i>
          <span>Gestión</span>
        </a>
      `;
    }
    nav.innerHTML = html;

    // Attach click events
    nav.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const targetTab = item.getAttribute('data-tab');
        if (targetTab === 'gestion') {
          switchTab(activeGestionTab[activeRole]);
        } else {
          switchTab(targetTab);
        }
      });
    });
  }

  function _buildMobileChips() {
    const chipsBar = document.getElementById('mobile-chips-bar');
    if (!chipsBar) return;

    const isGestionActive = activeTab !== 'mapa' && activeTab !== 'dashboard' && activeTab !== 'admin-general';
    
    // Hide if not in mobile view or not in a gestion tab or if vendeur
    if (!isMobile || !isGestionActive || activeRole === 'vendedor') {
      chipsBar.style.display = 'none';
      return;
    }

    chipsBar.style.display = 'flex';
    
    // Sub-menu items for table gestion
    const items = (MENUS[activeRole] || []).filter(m => m.id !== 'mapa' && m.id !== 'dashboard');
    
    chipsBar.innerHTML = items.map(m => `
      <div class="mobile-chip${m.id === activeTab ? ' active' : ''}" data-tab="${m.id}">
        <span>${m.label}</span>
      </div>
    `).join('');

    // Attach click events
    chipsBar.querySelectorAll('.mobile-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        e.preventDefault();
        const tabId = chip.getAttribute('data-tab');
        switchTab(tabId);
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     ON LOTE SELECTED (called from map)
     ══════════════════════════════════════════════════════ */
  function onLoteSelected(propiedadData) {
    if (!propiedadData) return;

    // Desktop: populate sidebar detail panel
    const details = document.getElementById('lote-details');
    const empty = document.getElementById('lote-empty');
    if (details) details.style.display = 'block';
    if (empty) empty.style.display = 'none';

    // Title & info
    const titleEl = document.getElementById('lote-title');
    const projEl = document.getElementById('lote-project');
    const areaEl = document.getElementById('lote-area');
    const priceEl = document.getElementById('lote-price');
    const badgeEl = document.getElementById('lote-status-badge');

    if (titleEl) titleEl.textContent = propiedadData.nombre || `Lote ${propiedadData.id}`;
    if (projEl) {
      // Resolve project name from etapa
      const etapa = propiedadData.id_etapa ? APP5T_DB.getById('etapas', propiedadData.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
      projEl.textContent = proy ? proy.nombre_proyecto : '—';
    }
    if (areaEl) areaEl.textContent = propiedadData.superficie || '—';
    if (priceEl) priceEl.textContent = APP5T_Utils.formatMoneda(propiedadData.valor_final || 0);
    if (badgeEl) badgeEl.innerHTML = getStatusBadgeHTML(propiedadData.estado);

    // Render the action form
    const formContainer = document.getElementById('lote-action-form');
    if (formContainer && typeof APP5T_Forms !== 'undefined') {
      APP5T_Forms.renderLoteForm(formContainer, propiedadData, activeRole);
    }

    // Mobile: render directly inside bottom sheet for live event handlers
    if (isMobile) {
      const sheetContent = document.getElementById('bottom-sheet-content');
      if (sheetContent) {
        const etapa = propiedadData.id_etapa ? APP5T_DB.getById('etapas', propiedadData.id_etapa) : null;
        const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
        const proyectoNombre = proy ? proy.nombre_proyecto : '—';
        const formattedPrice = APP5T_Utils.formatMoneda(propiedadData.valor_final || 0);

        sheetContent.innerHTML = `
          <div class="lote-details-mobile">
            <div class="lote-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div>
                <h2 class="lote-title" style="margin:0; font-size:1.3rem;">${propiedadData.nombre || `Lote ${propiedadData.id}`}</h2>
                <span class="lote-project" style="font-size:0.8rem; color:var(--text-muted);">${proyectoNombre}</span>
              </div>
              <span class="status-badge">${getStatusBadgeHTML(propiedadData.estado)}</span>
            </div>
            <div class="lote-specs" style="display:flex; gap:16px; margin-bottom:12px;">
              <div class="spec" style="flex:1;">
                <span class="spec-label" style="font-size:0.75rem; color:var(--text-muted); display:block;">Superficie</span>
                <span class="spec-value" style="font-size:0.95rem; font-weight:600; color:var(--text-white);">${propiedadData.superficie || '—'}</span>
              </div>
              <div class="spec" style="flex:1;">
                <span class="spec-label" style="font-size:0.75rem; color:var(--text-muted); display:block;">Precio Lista</span>
                <span class="spec-value" style="font-size:0.95rem; font-weight:600; color:var(--text-white);">${formattedPrice}</span>
              </div>
            </div>
            <hr class="divider">
            <div id="lote-action-form-mobile"></div>
          </div>
        `;

        const mobileFormContainer = document.getElementById('lote-action-form-mobile');
        if (mobileFormContainer && typeof APP5T_Forms !== 'undefined') {
          APP5T_Forms.renderLoteForm(mobileFormContainer, propiedadData, activeRole);
        }
        
        _expandBottomSheet();
      }
    }
  }

  /* ══════════════════════════════════════════════════════
     REFRESH ALL — Master data refresh
     ══════════════════════════════════════════════════════ */
  function refreshAll() {
    const stats = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getStats() : null;

    // ── 1. KPI cards (if stats available) ──
    if (stats) {
      _setContent('kpi-total', stats.totales);
      _setContent('kpi-disponibles', stats.disponibles);
      _setContent('kpi-reservadas', (stats.reservadas || 0) + (stats.solicitadas || 0));
      _setContent('kpi-promesadas', stats.enPromesa || stats.promesadas || 0);
      _setContent('kpi-vendidas', stats.vendidas);
      _setContent('kpi-ingreso', APP5T_Utils.formatMoneda(stats.ingresoRecaudado || 0));
    }

    // ── 2. Dashboard charts ──
    if (activeTab === 'dashboard' && typeof APP5T_Charts !== 'undefined') {
      APP5T_Charts.renderDashboard(activeRole);
    }

    // ── 3. Recent transactions ──
    _renderTransactions();

    // ── 4. Approvals table ──
    _renderAprobaciones();

    // ── 5. Price control table ──
    _renderPrecios();

    // ── 6. Mesa Documental: Promesas ──
    _renderMesaPromesas();

    // ── 7. Mesa Documental: Escrituras ──
    _renderMesaEscrituras();

    // ── 8. Cuenta Corriente ──
    _renderCtaCte();

    // ── 9. Inventario ──
    _renderInventario();

    // ── 10. Auditoría ──
    _renderAuditoria();

    // ── 11. Leads ──
    _renderLeads();

    // ── 12. Refresh map colors ──
    if (typeof APP5T_Map !== 'undefined') {
      try { APP5T_Map.refreshColors(); } catch (e) { /* map not initialized */ }
    }
  }

  /* ── Table renderers ── */

  function _setContent(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '—';
  }

  function _renderTransactions() {
    const tbody = document.getElementById('tbody-transactions');
    if (!tbody) return;
    const negs = (APP5T_DB.getAll('negociaciones') || []).slice(-10).reverse();
    if (negs.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin negociaciones</td></tr>'; return; }
    tbody.innerHTML = negs.map(n => {
      const prop = APP5T_DB.getById('propiedades', n.id_propiedad);
      const cli = APP5T_DB.getById('clientes', n.id_cliente);
      const vend = APP5T_DB.getById('vendedores', n.id_vendedor);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      const loteProy = prop ? `${prop.nombre} / ${proy ? proy.nombre_proyecto : '—'}` : `Lote ${n.id_propiedad}`;
      return `<tr>
        <td>${n.fecha_negociacion || '—'}</td>
        <td>${loteProy}</td>
        <td>${cli ? `${cli.nombres} ${cli.apellidos}` : '—'}</td>
        <td>${vend ? vend.nombre : '—'}</td>
        <td>${APP5T_Utils.formatMoneda(n.valor_final || 0)}</td>
        <td>${getStatusBadgeHTML(n.estado_avance)}</td>
      </tr>`;
    }).join('');
  }

  function _renderAprobaciones() {
    const tbody = document.getElementById('tbody-aprobaciones');
    if (!tbody) return;
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => p.estado === 'Pendiente');
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin aprobaciones pendientes</td></tr>'; return; }
    tbody.innerHTML = props.map(p => {
      const neg = (APP5T_DB.query('negociaciones', n => n.id_propiedad === p.id && n.estado_avance === 'En Curso') || [])[0];
      const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const vend = neg ? APP5T_DB.getById('vendedores', neg.id_vendedor) : null;
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const loteProy = `${p.nombre} / ${proy ? proy.nombre_proyecto : '—'}`;
      
      const precioLista = p.valor_final || 0;
      const precioOf = neg ? (neg.valor_final || 0) : 0;
      const margen = precioLista > 0 ? (((precioOf - precioLista) / precioLista) * 100).toFixed(1) : '0.0';

      return `<tr>
        <td>${loteProy}</td>
        <td>${cli ? `${cli.nombres} ${cli.apellidos}` : '—'}</td>
        <td>${vend ? vend.nombre : '—'}</td>
        <td>${neg ? APP5T_Utils.formatMoneda(neg.pie || 0) : '—'}</td>
        <td>${neg ? APP5T_Utils.formatMoneda(neg.valor_final || 0) : '—'}</td>
        <td>${margen}%</td>
        <td style="text-align:right">
          <button class="btn btn-sm btn-warning" onclick="APP5T._viewApproval('${p.id}')"><i class="fa-solid fa-eye"></i> Revisar</button>
        </td>
      </tr>`;
    }).join('');
  }

  function _renderPrecios() {
    const tbody = document.getElementById('tbody-precios');
    if (!tbody) return;
    const filter = document.getElementById('precios-filter-project');
    let props = APP5T_DB.getAll('propiedades') || [];
    if (filter && filter.value && filter.value !== 'all' && filter.value !== 'todos') {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      const proy = proyectos.find(p => p.nombre === filter.value || p.nombre_proyecto === filter.value);
      if (proy) {
        props = props.filter(p => p.id_proyecto === proy.id);
      }
    }
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin propiedades</td></tr>'; return; }
    tbody.innerHTML = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyectoNombre = proy ? proy.nombre_proyecto : '—';
      return `<tr>
        <td>${p.nombre || p.id}</td>
        <td>${proyectoNombre}</td>
        <td>${p.superficie || '—'} m²</td>
        <td>${APP5T_Utils.formatMoneda(p.valor_final || 0)}</td>
        <td>${getStatusBadgeHTML(p.estado)}</td>
      </tr>`;
    }).join('');
  }

  function _renderMesaPromesas() {
    const tbody = document.getElementById('tbody-mesa-promesas');
    if (!tbody) return;
    const negs = (APP5T_DB.getAll('negociaciones') || []).filter(n =>
      n.id_proceso === 'Reserva' && n.estado_avance === 'En Curso'
    );
    // Cross-reference with propiedades estado='Reservada'
    const items = negs.filter(n => {
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      return p && p.estado === 'Reservada';
    });
    if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin promesas pendientes</td></tr>'; return; }
    tbody.innerHTML = items.map(n => {
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      const c = APP5T_DB.getById('clientes', n.id_cliente);
      const proy = p ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const loteProy = p ? `${p.nombre} / ${proy ? proy.nombre_proyecto : '—'}` : `Lote ${n.id_propiedad}`;
      return `<tr>
        <td>${loteProy}</td>
        <td>${c ? `${c.nombres} ${c.apellidos}` : '—'}</td>
        <td>${APP5T_Utils.formatMoneda(n.valor_final || 0)}</td>
        <td style="text-align:right"><button class="btn btn-sm btn-primary" onclick="APP5T._signPromesa('${n.id}')"><i class="fa-solid fa-file-signature"></i> Promesa</button></td>
      </tr>`;
    }).join('');
  }

  function _renderMesaEscrituras() {
    const tbody = document.getElementById('tbody-mesa-escrituras');
    if (!tbody) return;
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => p.estado === 'Promesada');
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin escrituras pendientes</td></tr>'; return; }
    tbody.innerHTML = props.map(p => {
      const neg = (APP5T_DB.query('negociaciones', n => n.id_propiedad === p.id) || [])[0];
      const c = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const loteProy = `${p.nombre} / ${proy ? proy.nombre_proyecto : '—'}`;
      return `<tr>
        <td>${loteProy}</td>
        <td>${c ? `${c.nombres} ${c.apellidos}` : '—'}</td>
        <td>${APP5T_Utils.formatMoneda(neg ? neg.valor_final : p.valor_final)}</td>
        <td style="text-align:right"><button class="btn btn-sm btn-danger" onclick="APP5T._signEscritura('${p.id}')"><i class="fa-solid fa-gavel"></i> Escritura</button></td>
      </tr>`;
    }).join('');
  }

  function _renderCtaCte() {
    const tbody = document.getElementById('tbody-ctacte');
    if (!tbody) return;
    const ctas = APP5T_DB.getAll('cuenta_corriente') || [];
    if (ctas.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Sin registros</td></tr>'; return; }
    tbody.innerHTML = ctas.map(c => {
      const cli = APP5T_DB.getById('clientes', c.id_cliente);
      const prop = APP5T_DB.getById('propiedades', c.id_propiedad);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      const loteProy = prop ? `${prop.nombre} / ${proy ? proy.nombre_proyecto : '—'}` : `Lote ${c.id_propiedad}`;
      return `<tr>
        <td>${cli ? `${cli.nombres} ${cli.apellidos}` : '—'}</td>
        <td>${loteProy}</td>
        <td>${c.cuota_nro || '—'}</td>
        <td>${APP5T_Utils.formatMoneda(c.valor_cuota || 0)}</td>
        <td>${c.fecha_vencimiento || '—'}</td>
        <td>${APP5T_Utils.formatMoneda(c.valor_pagado || 0)}</td>
        <td>${getStatusBadgeHTML(c.estado_cuota)}</td>
        <td style="text-align:right">
          ${c.estado_cuota !== 'Pagada' ? `<button class="btn btn-sm btn-success" onclick="APP5T._payCuota('${c.id}')"><i class="fa-solid fa-receipt"></i> Pagar</button>` : '—'}
        </td>
      </tr>`;
    }).join('');
  }

  function _renderInventario() {
    const tbody = document.getElementById('tbody-inventario');
    if (!tbody) return;
    const filter = document.getElementById('inv-filter-project');
    let props = APP5T_DB.getAll('propiedades') || [];
    if (filter && filter.value && filter.value !== 'all' && filter.value !== 'todos') {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      const proy = proyectos.find(p => p.nombre === filter.value || p.nombre_proyecto === filter.value);
      if (proy) {
        props = props.filter(p => p.id_proyecto === proy.id);
      }
    }
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin propiedades</td></tr>'; return; }
    tbody.innerHTML = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyectoNombre = proy ? proy.nombre_proyecto : '—';
      return `<tr>
        <td>${p.nombre || p.id}</td>
        <td>${proyectoNombre}</td>
        <td>${p.superficie || '—'} m²</td>
        <td>${APP5T_Utils.formatMoneda(p.valor_final || 0)}</td>
        <td>${getStatusBadgeHTML(p.estado)}</td>
      </tr>`;
    }).join('');
  }

  function _renderAuditoria() {
    const tbody = document.getElementById('tbody-auditoria');
    if (!tbody) return;
    const entries = (APP5T_DB.getAuditoria() || []).slice(0, 50);
    if (entries.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>'; return; }
    tbody.innerHTML = entries.map(a => `<tr>
      <td>${a.fecha ? APP5T_Utils.formatFecha(a.fecha) + ' ' + new Date(a.fecha).toLocaleTimeString() : '—'}</td>
      <td>${a.usuario || '—'}</td>
      <td>${a.rol || '—'}</td>
      <td>${a.tabla || '—'}</td>
      <td class="text-truncate" title="${(a.detalle || '').replace(/"/g, '&quot;')}">${(a.detalle || '').substring(0, 80)}</td>
    </tr>`).join('');
  }

  function _renderLeads() {
    const tbody = document.getElementById('tbody-leads');
    if (!tbody) return;
    // Find vendedor matching current role persona
    const vendedores = APP5T_DB.getAll('vendedores') || [];
    const vendActivo = vendedores.find(v => v.estado === 'Activo') || vendedores[0];
    const idVend = vendActivo ? vendActivo.id : null;

    let clientes = APP5T_DB.getAll('clientes') || [];
    if (idVend) {
      clientes = clientes.filter(c => String(c.id_vendedor) === String(idVend));
    }
    if (clientes.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin leads asignados</td></tr>'; return; }
    tbody.innerHTML = clientes.map(c => `<tr>
      <td>${c.nombres || ''} ${c.apellidos || ''}</td>
      <td>${c.rut || '—'}</td>
      <td>${c.telefono || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.canal_captacion || '—'}</td>
      <td>${getStatusBadgeHTML(c.estado_cliente)}</td>
    </tr>`).join('');
  }

  /* ── Quick action helpers (called from table buttons) ── */

  function _viewApproval(idProp) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    const html = '<div id="modal-approval-form"></div>';
    openModal('Revisión de Aprobación', html);
    setTimeout(() => {
      const container = document.getElementById('modal-approval-form');
      if (container) APP5T_Forms.renderLoteForm(container, prop, activeRole);
    }, 50);
  }

  function _signPromesa(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    if (!prop) return;
    const html = '<div id="modal-promesa-form"></div>';
    openModal('Firmar Promesa', html);
    setTimeout(() => {
      const container = document.getElementById('modal-promesa-form');
      if (container) APP5T_Forms.renderLoteForm(container, prop, 'administrador');
    }, 50);
  }

  function _signEscritura(idProp) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    const html = '<div id="modal-escritura-form"></div>';
    openModal('Firmar Escritura', html);
    setTimeout(() => {
      const container = document.getElementById('modal-escritura-form');
      if (container) APP5T_Forms.renderLoteForm(container, prop, 'administrador');
    }, 50);
  }

  function _payCuota(idCtaCte) {
    const cta = APP5T_DB.getById('cuenta_corriente', idCtaCte);
    if (!cta) return;
    const html = '<div id="modal-pago-form"></div>';
    openModal('Registrar Pago de Cuota', html);
    setTimeout(() => {
      const container = document.getElementById('modal-pago-form');
      if (container) APP5T_Forms.renderPagoForm(container, cta);
    }, 50);
  }

  function unlockAdmin() {
    if (adminUnlocked) return;
    adminUnlocked = true;
    _buildSidebar(activeRole);
    if (typeof APP5T_Utils !== 'undefined') {
      APP5T_Utils.showToast('Consola de Administración General desbloqueada', 'success');
    }
  }

  /* ══════════════════════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════════════════════ */
  function _init() {
    // 1. Initialize DB
    try {
      if (typeof APP5T_DB !== 'undefined') {
        APP5T_DB.init();
      }
    } catch (e) {
      console.error('APP5T: Error initializing DB:', e);
    }

    // 2. Configure & init sync
    try {
      if (typeof APP5T_Sync !== 'undefined') {
        const syncUrl = (typeof APP5T_CONFIG !== 'undefined' && APP5T_CONFIG.APPS_SCRIPT_URL)
          ? APP5T_CONFIG.APPS_SCRIPT_URL : '';
        APP5T_Sync.configure(syncUrl);
        APP5T_Sync.init();
      }
    } catch (e) {
      console.error('APP5T: Error initializing Sync:', e);
    }

    // 3. Attach all event listeners BEFORE switching roles (resilient design)

    // Role selector buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const role = btn.getAttribute('data-role');
        switchRole(role);
      });
    });

    // Hamburger
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger) {
      hamburger.addEventListener('click', _openSidebar);
    }

    // Sidebar overlay
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', _closeSidebar);
    }

    // Map project select
    const mapProjSel = document.getElementById('map-project-select');
    if (mapProjSel) {
      mapProjSel.addEventListener('change', e => {
        if (typeof APP5T_Map !== 'undefined') APP5T_Map.zoomToProject(e.target.value);
      });
    }

    // Map status filter
    const mapFilter = document.getElementById('map-status-filter');
    if (mapFilter) {
      mapFilter.addEventListener('change', e => {
        if (typeof APP5T_Map !== 'undefined') APP5T_Map.applyFilter(e.target.value);
      });
    }

    // Price control project filter
    const preciosProjSel = document.getElementById('precios-filter-project');
    if (preciosProjSel) {
      preciosProjSel.addEventListener('change', () => _renderPrecios());
    }

    // General inventory project filter
    const invProjSel = document.getElementById('inv-filter-project');
    if (invProjSel) {
      invProjSel.addEventListener('change', () => _renderInventario());
    }

    // Sync status click -> trigger manual syncAll
    const syncStatusEl = document.getElementById('sync-status');
    if (syncStatusEl) {
      syncStatusEl.style.cursor = 'pointer';
      syncStatusEl.addEventListener('click', e => {
        e.preventDefault();
        if (typeof APP5T_Sync !== 'undefined') {
          APP5T_Sync.syncAll();
        }
      });
    }

    // Window resize
    window.addEventListener('resize', () => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth < 768;
      if (wasMobile && !isMobile) _closeSidebar();
      if (wasMobile !== isMobile) {
        _buildSidebar(activeRole);
        _buildMobileNav(activeRole);
        _buildMobileChips();
      }
    });

    // CRUD tabs
    document.querySelectorAll('.crud-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.crud-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const entity = tab.getAttribute('data-entity');
        const crudContent = document.getElementById('crud-content');
        if (crudContent && entity) {
          APP5T_Forms.renderCRUDTable(crudContent, entity);
        }
      });
    });

    // Modal close button
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // Modal backdrop click and form dirtiness tracking
    const modal = document.getElementById('action-modal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
      });
      // Track user inputs to warn about unsaved changes
      modal.addEventListener('input', () => {
        window.APP5T_isFormDirty = true;
      });
      modal.addEventListener('change', () => {
        window.APP5T_isFormDirty = true;
      });
    }

    // Mobile bottom sheet and navs
    _initBottomSheet();
    _buildMobileNav(activeRole);
    _buildMobileChips();

    // Bind toggles to reactively rebuild sidebar menu
    const toggles = [
      'toggle-vendedor-kpis', 'toggle-vendedor-mapa', 'toggle-vendedor-leads',
      'toggle-gerente-dashboard', 'toggle-gerente-charts', 'toggle-gerente-precios',
      'toggle-admin-mesa', 'toggle-admin-ctacte', 'toggle-admin-carga'
    ];
    toggles.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => _buildSidebar(activeRole));
      }
    });

    // Keystroke trigger: Ctrl + Alt + A to unlock admin panel
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        unlockAdmin();
      }
    });

    // Logo click trigger: 1 click to unlock admin panel
    const brandEl = document.querySelector('.sidebar-brand');
    if (brandEl) {
      brandEl.addEventListener('click', () => {
        unlockAdmin();
      });
    }

    // 4. Initial switch to default role (safe trigger)
    try {
      switchRole('vendedor');
    } catch (e) {
      console.error('APP5T: Error switching to initial role vendedor:', e);
    }

    console.log('APP5T: Initialized successfully.');
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════ */
  const api = {
    switchRole,
    switchTab,
    refreshAll,
    openModal,
    closeModal,
    onLoteSelected,
    getStatusBadgeHTML,
    unlockAdmin,
    getActiveRole: () => activeRole,
    getActiveUser: () => ROLE_NAMES[activeRole]?.name || 'Sistema',
    // Internal helpers exposed for inline onclick
    _viewApproval,
    _signPromesa,
    _signEscritura,
    _payCuota
  };

  window.APP5T = api;
  return api;
})();
