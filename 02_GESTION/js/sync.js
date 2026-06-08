/**
 * =====================================================
 * SYNC.JS — APP5T_Sync
 * Módulo de Sincronización con Google Sheets — 5 Tierras
 * 100% independiente del resto del stack
 * =====================================================
 */
const APP5T_Sync = (() => {
  'use strict';

  /* ══════════════════════════════════════════════════════
     CONFIGURATION
     ══════════════════════════════════════════════════════ */
  let CONFIG = {
    APPS_SCRIPT_URL: '',
    SYNC_INTERVAL: 30000,   // 30 seconds
    ENABLED: false
  };

  const PENDING_KEY = 'app5t_sync_pending';
  let _intervalId = null;
  let _isSyncing = false;

  /* ══════════════════════════════════════════════════════
     DATA DICTIONARY MAPPING (Local ↔ Google Sheets)
     ══════════════════════════════════════════════════════ */
  const MAPPING = {
    vendedores: {
      sheetName: 'Vendedores',
      pk: 'id',
      fields: {
        id: 'Id_vendedor',
        rut: 'Rut_vendedor',
        nombre: 'Nombre_vendedor',
        fecha_ingreso: 'Fecha_ingreso',
        ciudad: 'Ciudad',
        telefono: 'Telefono',
        email: 'Correo_electronico',
        cargo: 'Cargo',
        estado: 'Estado'
      }
    },
    clientes: {
      sheetName: 'Clientes',
      pk: 'id',
      fields: {
        id: 'Id_cliente',
        rut: 'Rut_cliente',
        nombres: 'Nombres',
        apellidos: 'Apellidos',
        fecha_nacimiento: 'Fecha_nacimiento',
        direccion: 'Direccion',
        comuna: 'Comuna',
        telefono: 'Telefono',
        email: 'Correo_electronico',
        estado_civil: 'Estado_civil',
        regimen_matrimonial: 'Regimen_matrimonial',
        fecha_ingreso: 'Fecha_ingreso',
        canal_captacion: 'Canal_captacion',
        id_vendedor: 'Vendedor_assigned',
        motivo_busqueda: 'Motivo_busqueda',
        notas: 'Notas',
        historial: 'Historial',
        estado_cliente: 'Estado_cliente'
      }
    },
    proyectos: {
      sheetName: 'Proyectos',
      pk: 'id',
      fields: {
        id: 'Id_proyecto',
        nombre_proyecto: 'Nombre_proyecto',
        nombre: 'Nombre_proyecto',
        ubicacion: 'Ubicacion',
        comuna: 'Comuna',
        coordenadas_centro: 'Coordenadas',
        superficie: 'Superficie',
        rol: 'Rol',
        deslindes: 'Deslindes',
        infraestructura: 'Infraestructura',
        caracteristicas: 'Caracteristicas',
        fecha_dom: 'Fecha_DOM',
        fecha_ingreso: 'Fecha_ingreso',
        estado_proyecto: 'Estado_proyecto',
        nro_etapas: 'Nro_etapas',
        url: 'Url'
      }
    },
    etapas: {
      sheetName: 'Etapas',
      pk: 'id',
      fields: {
        id: 'Id_etapa',
        id_proyecto: 'Id_proyecto',
        nombre_etapa: 'Nombre_etapa',
        nombre: 'Nombre_etapa',
        nro_lotes: 'Nro_lotes',
        superficie: 'Superficie',
        fecha_ingreso: 'Fecha_ingreso',
        fecha_dom: 'Fecha_DOM',
        estado_etapa: 'Estado_etapa',
        fecha_inicio: 'Fecha_inicio',
        fecha_cierre: 'Fecha_cierre',
        url: 'Url'
      }
    },
    propiedades: {
      sheetName: 'Propiedades',
      pk: 'id',
      fields: {
        id: 'Id_propiedad',
        id_etapa: 'Id_etapa',
        id_proyecto: 'Id_proyecto',
        nombre: 'Nombre_propiedad',
        rol: 'Rol_propiedad',
        superficie: 'Superficie',
        valor_final: 'Valor_final',
        fecha_ingreso: 'Fecha_ingreso',
        deslindes: 'Deslindes',
        infraestructura: 'Infraestructura',
        fecha_reserva: 'Fecha_reserva',
        fecha_fin_promesa: 'Fecha_fin_promesa',
        fecha_venta: 'Fecha_venta',
        url: 'Url',
        estado: 'Estado'
      }
    },
    directorio: {
      sheetName: 'Directorio',
      pk: 'id',
      fields: {
        id: 'Id_director',
        rut: 'Rut_director',
        nombre: 'Nombre_director',
        cargo: 'Cargo',
        telefono: 'Telefono',
        email: 'Correo_electronico',
        fecha_ingreso: 'Fecha_ingreso',
        estado: 'Estado',
        auth_reserva: 'Autorizacion_reserva',
        firma_reserva: 'Firma_reserva',
        auth_promesa: 'Autorizacion_promesa',
        firma_promesa: 'Firma_promesa',
        auth_venta: 'Autorizacion_venta',
        firma_venta: 'Firma_venta'
      }
    },
    negociaciones: {
      sheetName: 'Negociaciones',
      pk: 'id',
      fields: {
        id: 'Id_negociacion',
        id_propiedad: 'Id_propiedad',
        id_vendedor: 'Id_vendedor',
        id_cliente: 'Id_cliente',
        fecha_negociacion: 'Fecha_negociacion',
        valor_final: 'Valor_final',
        pie: 'Pie',
        cantidad_cuotas: 'Cantidad_cuotas',
        fecha_vencimiento_cuota: 'Fecha_vencimiento_cuota',
        tipo_moneda: 'Tipo_moneda',
        url: 'Url',
        estado_avance: 'Estado_avance',
        reajuste: 'Reajuste',
        id_proceso: 'Id_proceso'
      }
    },
    cuenta_corriente: {
      sheetName: 'Cuenta_Corriente',
      pk: 'id',
      fields: {
        id: 'Id_ctacte',
        id_cliente: 'Id_cliente',
        id_propiedad: 'Id_propiedad',
        cuota_nro: 'Cuota_nro',
        valor_cuota: 'Valor_cuota',
        fecha_vencimiento: 'Fecha_vencimiento',
        valor_pagado: 'Valor_pagado',
        fecha_pago: 'Fecha_pago',
        url: 'Url',
        estado_cuota: 'Estado_cuota'
      }
    }
  };

  function _toSheetRecord(tabla, localRec) {
    if (!localRec) return null;
    const map = MAPPING[tabla];
    if (!map) return localRec;
    const sheetRec = {};
    Object.entries(map.fields).forEach(([localKey, sheetKey]) => {
      let val = localRec[localKey];
      if (val === undefined && localKey === 'id') {
        val = localRec.id;
      }
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      sheetRec[sheetKey] = val;
    });
    return sheetRec;
  }

  function _toLocalRecord(tabla, sheetRec) {
    if (!sheetRec) return null;
    const map = MAPPING[tabla];
    if (!map) return sheetRec;
    const localRec = {};
    Object.entries(map.fields).forEach(([localKey, sheetKey]) => {
      let val = sheetRec[sheetKey];
      if (localKey === 'coordenadas_centro' && typeof val === 'string' && val.startsWith('{')) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      localRec[localKey] = val;
    });
    const pkVal = sheetRec[map.fields.id];
    if (pkVal !== undefined) {
      localRec.id = Number(pkVal) || pkVal;
    }
    return localRec;
  }

  /* ══════════════════════════════════════════════════════
     CONFIGURE
     ══════════════════════════════════════════════════════ */

  /**
   * Set the Apps Script URL and enable sync if valid.
   * @param {string} url - The deployed Apps Script web app URL
   */
  function configure(url) {
    CONFIG.APPS_SCRIPT_URL = (url || '').trim();
    CONFIG.ENABLED = !!(CONFIG.APPS_SCRIPT_URL && CONFIG.APPS_SCRIPT_URL.startsWith('http'));
    console.log(`APP5T_Sync: Configured. Enabled=${CONFIG.ENABLED}`);
  }

  /**
   * Check if sync is configured and enabled.
   * @returns {boolean}
   */
  function isConfigured() {
    return CONFIG.ENABLED && CONFIG.APPS_SCRIPT_URL.length > 0;
  }

  /* ══════════════════════════════════════════════════════
     PENDING QUEUE MANAGEMENT
     ══════════════════════════════════════════════════════ */

  function _getPending() {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function _savePending(queue) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  }

  function _addPending(tabla, action, data) {
    const queue = _getPending();
    queue.push({
      tabla: tabla,
      action: action,
      data: data,
      timestamp: new Date().toISOString()
    });
    _savePending(queue);
    updateIndicator('pending');
    console.warn(`APP5T_Sync: Queued pending ${action} on ${tabla}`);
  }

  async function _replayPending() {
    const queue = _getPending();
    if (queue.length === 0) return;

    console.log(`APP5T_Sync: Replaying ${queue.length} pending operations...`);
    const failed = [];

    for (const item of queue) {
      try {
        const sheetTable = MAPPING[item.tabla]?.sheetName || item.tabla;
        const mappedData = _toSheetRecord(item.tabla, item.data);
        
        await _post({
          action: item.action,
          tabla: sheetTable,
          data: mappedData,
          id: mappedData ? mappedData[MAPPING[item.tabla]?.fields.id || 'id'] : undefined,
          usuario: 'Replay APP_5T'
        });
      } catch (e) {
        failed.push(item);
      }
    }

    _savePending(failed);
    if (failed.length === 0) {
      console.log('APP5T_Sync: All pending operations replayed successfully.');
    } else {
      console.warn(`APP5T_Sync: ${failed.length} operations still pending.`);
    }
  }

  /* ══════════════════════════════════════════════════════
     HTTP HELPERS
     ══════════════════════════════════════════════════════ */

  /**
   * Perform a GET request to the Apps Script endpoint.
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>}
   */
  async function _get(params) {
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const resp = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  /**
   * Perform a POST request to the Apps Script endpoint.
   * @param {Object} body - JSON body
   * @returns {Promise<Object>}
   */
  async function _post(body) {
    const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */

  /**
   * Initialize sync: ping the endpoint and start interval.
   */
  async function init() {
    if (!isConfigured()) {
      updateIndicator('offline');
      console.log('APP5T_Sync: Not configured, running in offline mode.');
      return;
    }

    updateIndicator('syncing');

    try {
      const result = await _get({ action: 'ping' });
      if (result && result.status === 'online') {
        updateIndicator('online');
        console.log('APP5T_Sync: Endpoint online.', result);

        // Replay any pending operations
        await _replayPending();

        // Start periodic sync
        _startInterval();
      } else {
        updateIndicator('offline');
        console.warn('APP5T_Sync: Ping returned unexpected response.', result);
      }
    } catch (e) {
      updateIndicator('offline');
      console.warn('APP5T_Sync: Ping failed.', e.message);
    }
  }

  function _startInterval() {
    if (_intervalId) clearInterval(_intervalId);
    _intervalId = setInterval(async () => {
      if (_isSyncing) return;
      _isSyncing = true;
      try {
        await _replayPending();
        // Optionally fetch new data from server
        // await fetchAll();  // Uncomment for pull-sync
        updateIndicator('online');
      } catch (e) {
        updateIndicator('pending');
      } finally {
        _isSyncing = false;
      }
    }, CONFIG.SYNC_INTERVAL);
  }

  /* ══════════════════════════════════════════════════════
     FETCH ALL
     ══════════════════════════════════════════════════════ */

  /**
   * Fetch all table data from Google Sheets.
   * @returns {Promise<Object>} Object with all tables' records
   */
  async function fetchAll() {
    if (!isConfigured()) throw new Error('Sync not configured');

    updateIndicator('syncing');
    try {
      const result = await _get({ action: 'readAll' });
      updateIndicator('online');
      return result;
    } catch (e) {
      updateIndicator('offline');
      _addPending('_system', 'fetchAll', {});
      throw e;
    }
  }

  /* ══════════════════════════════════════════════════════
     PUSH RECORD
     ══════════════════════════════════════════════════════ */

  /**
   * Push a single record change to Google Sheets.
   * @param {string} tabla - Table name
   * @param {string} action - 'insert' | 'update' | 'delete'
   * @param {Object} data - Record data
   * @param {string} usuario - User performing the action
   */
  async function pushRecord(tabla, action, data, usuario) {
    const sheetTable = MAPPING[tabla]?.sheetName || tabla;
    const mappedData = _toSheetRecord(tabla, data);

    if (!isConfigured()) {
      _addPending(tabla, action, data);
      return;
    }

    updateIndicator('syncing');
    try {
      const body = {
        action: action,
        tabla: sheetTable,
        data: mappedData,
        id: mappedData ? mappedData[MAPPING[tabla]?.fields.id || 'id'] : undefined,
        usuario: usuario || 'Consola APP_5T'
      };
      const result = await _post(body);
      updateIndicator('online');
      return result;
    } catch (e) {
      _addPending(tabla, action, data);
      updateIndicator('pending');
      console.warn(`APP5T_Sync: pushRecord failed for ${tabla}/${action}.`, e.message);
    }
  }

  /* ══════════════════════════════════════════════════════
     SYNC ALL (BATCH)
     ══════════════════════════════════════════════════════ */

  /**
   * Push all localStorage tables to Google Sheets in a single batch.
   */
  async function syncAll() {
    if (!isConfigured()) {
      APP5T_Utils.showToast('Sincronización no configurada', 'warning');
      return;
    }

    updateIndicator('syncing');

    try {
      // Build object with all tables from localStorage
      const tables = ['vendedores', 'clientes', 'proyectos', 'etapas', 'propiedades', 'directorio', 'negociaciones', 'cuenta_corriente'];
      const datos = {};
      tables.forEach(t => {
        const records = APP5T_DB.getAll(t) || [];
        if (records && records.length) {
          const sheetTable = MAPPING[t]?.sheetName || t;
          datos[sheetTable] = records.map(rec => _toSheetRecord(t, rec));
        }
      });

      const result = await _post({
        action: 'syncall',
        datos: datos,
        usuario: 'Consola APP_5T'
      });

      updateIndicator('online');
      APP5T_Utils.showToast('Sincronización completa', 'success');
      console.log('APP5T_Sync: syncAll completed.', result);
      return result;
    } catch (e) {
      updateIndicator('offline');
      APP5T_Utils.showToast('Error en sincronización masiva', 'error');
      console.error('APP5T_Sync: syncAll failed.', e);
    }
  }

  /* ══════════════════════════════════════════════════════
     INDICATOR
     ══════════════════════════════════════════════════════ */

  const STATUS_MAP = {
    online:  { text: 'En línea',       class: 'online',  icon: 'fa-circle-check' },
    syncing: { text: 'Sincronizando…', class: 'syncing', icon: 'fa-rotate' },
    pending: { text: 'Pendientes',     class: 'pending', icon: 'fa-clock' },
    offline: { text: 'Sin conexión',   class: 'offline', icon: 'fa-circle-xmark' }
  };

  /**
   * Update the sync status indicator in the UI.
   * @param {string} status - 'online' | 'syncing' | 'pending' | 'offline'
   */
  function updateIndicator(status) {
    const info = STATUS_MAP[status] || STATUS_MAP.offline;

    const dot = document.getElementById('sync-dot');
    if (dot) {
      dot.className = `sync-dot ${info.class}`;
    }

    const text = document.getElementById('sync-text');
    if (text) {
      text.textContent = info.text;
    }
  }

  /* ══════════════════════════════════════════════════════
     STOP SYNC
     ══════════════════════════════════════════════════════ */

  /**
   * Stop the periodic sync interval.
   */
  function stopSync() {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    console.log('APP5T_Sync: Sync stopped.');
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════ */
  const api = { configure, isConfigured, init, fetchAll, pushRecord, syncAll, stopSync, updateIndicator };
  window.APP5T_Sync = api;
  return api;
})();
