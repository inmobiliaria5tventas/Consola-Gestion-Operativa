/**
 * =====================================================
 * FORMS.JS — APP5T_Forms
 * Formularios dinámicos para CRM & GIS — 5 Tierras
 * =====================================================
 */
const APP5T_Forms = (() => {
  'use strict';

  /* ══════════════════════════════════════════════════════
     ENTITY SCHEMAS (field definitions for CRUD)
     ══════════════════════════════════════════════════════ */
  const ENTITY_SCHEMA = {
    vendedores: {
      pk: 'id_vendedor', label: 'Vendedor',
      fields: [
        { key: 'rut', label: 'RUT', type: 'text', required: true, validate: 'rut' },
        { key: 'nombre', label: 'Nombre', type: 'text', required: true },
        { key: 'fecha_ingreso', label: 'Fecha Ingreso', type: 'date' },
        { key: 'ciudad', label: 'Ciudad', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'tel', validate: 'telefono' },
        { key: 'email', label: 'Correo Electrónico', type: 'email', validate: 'email' },
        { key: 'cargo', label: 'Cargo', type: 'text' },
        { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ]
    },
    clientes: {
      pk: 'id_cliente', label: 'Cliente',
      fields: [
        { key: 'rut', label: 'RUT', type: 'text', required: true, validate: 'rut' },
        { key: 'nombres', label: 'Nombres', type: 'text', required: true },
        { key: 'apellidos', label: 'Apellidos', type: 'text', required: true },
        { key: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date' },
        { key: 'direccion', label: 'Dirección', type: 'text' },
        { key: 'comuna', label: 'Comuna', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'tel', validate: 'telefono' },
        { key: 'email', label: 'Correo Electrónico', type: 'email', validate: 'email' },
        { key: 'estado_civil', label: 'Estado Civil', type: 'select', options: ['Soltero', 'Casado', 'Viudo', 'Separado'] },
        { key: 'regimen_matrimonial', label: 'Régimen Matrimonial', type: 'select', options: ['Sociedad Conyugal', 'Separación de Bienes', 'Participación en los Gananciales'] },
        { key: 'canal_captacion', label: 'Canal de Captación', type: 'select', options: ['Directo', 'WhatsApp', 'Web', 'Instagram', 'Facebook'] },
        { key: 'id_vendedor', label: 'Vendedor Asignado', type: 'ref', ref: 'vendedores', refLabel: 'nombre' },
        { key: 'motivo_busqueda', label: 'Motivo de Búsqueda', type: 'select', options: ['Vivienda', 'Inversión', 'Recreacional'] },
        { key: 'notas', label: 'Notas', type: 'textarea' },
        { key: 'estado_cliente', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ]
    },
    directorio: {
      pk: 'id_director', label: 'Director',
      fields: [
        { key: 'rut', label: 'RUT', type: 'text', validate: 'rut' },
        { key: 'nombre', label: 'Nombre', type: 'text', required: true },
        { key: 'cargo', label: 'Cargo', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'tel', validate: 'telefono' },
        { key: 'email', label: 'Correo Electrónico', type: 'email', validate: 'email' },
        { key: 'estado', label: 'Estado', type: 'select', options: ['Disponible', 'Licencia', 'Viaje', 'No Disponible'], default: 'Disponible' },
        { key: 'auth_reserva', label: 'Autoriza Reserva', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'firma_reserva', label: 'Firma Reserva', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'auth_promesa', label: 'Autoriza Promesa', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'firma_promesa', label: 'Firma Promesa', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'auth_venta', label: 'Autoriza Venta', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'firma_venta', label: 'Firma Venta', type: 'select', options: ['S', 'N'], default: 'N' }
      ]
    },
    proyectos: {
      pk: 'id_proyecto', label: 'Proyecto',
      fields: [
        { key: 'nombre_proyecto', label: 'Nombre', type: 'text', required: true },
        { key: 'ubicacion', label: 'Ubicación', type: 'text' },
        { key: 'comuna', label: 'Comuna', type: 'text' },
        { key: 'coordenadas', label: 'Coordenadas', type: 'text' },
        { key: 'superficie', label: 'Superficie', type: 'text' },
        { key: 'rol', label: 'Rol', type: 'text' },
        { key: 'deslindes', label: 'Deslindes', type: 'textarea' },
        { key: 'infraestructura', label: 'Infraestructura', type: 'textarea' },
        { key: 'caracteristicas', label: 'Características', type: 'textarea' },
        { key: 'estado_proyecto', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo', 'En Desarrollo'], default: 'Activo' }
      ]
    },
    etapas: {
      pk: 'id_etapa', label: 'Etapa',
      fields: [
        { key: 'id_proyecto', label: 'Proyecto', type: 'ref', ref: 'proyectos', refLabel: 'nombre_proyecto', required: true },
        { key: 'nombre_etapa', label: 'Nombre Etapa', type: 'text', required: true },
        { key: 'nro_lotes', label: 'Nro. Lotes', type: 'number' },
        { key: 'superficie', label: 'Superficie', type: 'text' },
        { key: 'fecha_ingreso', label: 'Fecha Ingreso', type: 'date' },
        { key: 'fecha_dom', label: 'Fecha DOM', type: 'date' },
        { key: 'estado_etapa', label: 'Estado', type: 'select', options: ['Activa', 'Cerrada', 'En Desarrollo'], default: 'Activa' }
      ]
    }
  };

  /* ══════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════ */

  /** Create a labeled form group */
  function _group(label, inputHTML, id) {
    return `<div class="form-group">
      <label for="${id || ''}">${label}</label>
      ${inputHTML}
    </div>`;
  }

  /** Run field-level validation. Returns error message or '' */
  function _validateField(value, rule) {
    if (!value && rule !== 'required') return '';
    if (rule === 'rut')      return APP5T_Utils.validarRUT(value) ? '' : 'RUT inválido (ej: 12.345.678-5)';
    if (rule === 'telefono') return APP5T_Utils.validarTelefono(value) ? '' : 'Teléfono inválido';
    if (rule === 'email')    return APP5T_Utils.validarEmail(value) ? '' : 'Email inválido';
    return '';
  }

  /** Collect and validate a dynamic form. Returns {ok, data, errors} */
  function _collectForm(formEl, schema) {
    const data = {};
    const errors = [];
    schema.fields.forEach(f => {
      const el = formEl.querySelector(`[name="${f.key}"]`);
      if (!el) return;
      let val = el.value.trim();

      // Required check
      if (f.required && !val) {
        errors.push(`${f.label} es requerido`);
        el.classList.add('input-error');
        return;
      }
      el.classList.remove('input-error');

      // Type-specific validation
      if (f.validate && val) {
        const msg = _validateField(val, f.validate);
        if (msg) { errors.push(msg); el.classList.add('input-error'); return; }
      }

      if (f.type === 'number') val = APP5T_Utils.sanitizeNumber(val);
      data[f.key] = val;
    });
    return { ok: errors.length === 0, data, errors };
  }

  /** Build an HTML <select> from reference table */
  function _refSelect(name, refTable, refLabel, selected) {
    const items = APP5T_DB.getAll(refTable) || [];
    let opts = `<option value="">— Seleccionar —</option>`;
    items.forEach(r => {
      const id = r[ENTITY_SCHEMA[refTable]?.pk] || r.id;
      const label = r[refLabel] || r.nombre || id;
      const sel = String(id) === String(selected) ? 'selected' : '';
      opts += `<option value="${id}" ${sel}>${label}</option>`;
    });
    return `<select name="${name}" class="form-control">${opts}</select>`;
  }

  /* ══════════════════════════════════════════════════════
     renderLoteForm
     ══════════════════════════════════════════════════════ */
  function renderLoteForm(container, propiedad, role) {
    if (!container || !propiedad) return;
    const estado = (propiedad.estado || '').trim();

    // ── DISPONIBLE + vendedor / gerente ───────────────
    if (estado === 'Disponible' && (role === 'vendedor' || role === 'gerente')) {
      const clientes = (APP5T_DB.getAll('clientes') || []).filter(c => c.estado_cliente === 'Activo');
      if (clientes.length === 0) {
        container.innerHTML = `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i> Registre un cliente primero en la sección de Carga de Datos.</div>`;
        return;
      }
      const precioFmt = APP5T_Utils.formatMoneda(propiedad.valor_final || 0);
      let clienteOpts = `<option value="">— Seleccionar cliente —</option>`;
      clientes.forEach(c => {
        const lbl = `${c.nombres || ''} ${c.apellidos || ''} (${c.rut || 'S/RUT'})`;
        clienteOpts += `<option value="${c.id}">${lbl}</option>`;
      });

      container.innerHTML = `
        <form id="frm-reserva" class="form-card">
          <h4><i class="fa-solid fa-handshake"></i> Solicitar Reserva</h4>
          ${_group('Cliente', `<select name="id_cliente" class="form-control" required>${clienteOpts}</select>`, 'id_cliente')}
          ${_group('Precio Ofertado', `<input type="text" name="precio_oferta" class="form-control" value="${precioFmt}">`, 'precio_oferta')}
          ${_group('Monto Reserva', `<input type="text" name="monto_reserva" class="form-control" value="$ 200.000">`, 'monto_reserva')}
          ${_group('Método de Pago', `<select name="metodo_pago" class="form-control">
            <option>Transferencia</option><option>Depósito</option><option>Cheque</option>
          </select>`, 'metodo_pago')}
          ${_group('Notas', `<textarea name="notas" class="form-control" rows="3" placeholder="Observaciones adicionales..."></textarea>`, 'notas')}
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Solicitar Reserva</button>
        </form>`;

      container.querySelector('#frm-reserva').addEventListener('submit', e => {
        e.preventDefault();
        try {
          const frm = e.target;
          const idCliente = frm.querySelector('[name="id_cliente"]').value;
          if (!idCliente) { APP5T_Utils.showToast('Seleccione un cliente', 'warning'); return; }

          // Determine vendedor
          const vendedores = APP5T_DB.getAll('vendedores') || [];
          const vendActivo = vendedores.find(v => v.estado === 'Activo') || vendedores[0];
          const idVendedor = vendActivo ? vendActivo.id : 0;

          const payload = {
            precio_oferta: APP5T_Utils.parseMoneda(frm.querySelector('[name="precio_oferta"]').value),
            monto_reserva: APP5T_Utils.parseMoneda(frm.querySelector('[name="monto_reserva"]').value),
            metodo_pago: frm.querySelector('[name="metodo_pago"]').value,
            notas: frm.querySelector('[name="notas"]').value
          };

          const res = APP5T_DB.solicitarReserva(propiedad.id, idVendedor, idCliente, payload);
          if (res && !res.success) {
            APP5T_Utils.showToast(`Error al solicitar reserva: ${res.error || 'Desconocido'}`, 'error');
            return;
          }
          APP5T_Utils.showToast('Reserva solicitada exitosamente', 'success');
          if (window.APP5T && APP5T.refreshAll) APP5T.refreshAll();
          APP5T.closeModal(true);
        } catch (err) {
          console.error(err);
          alert(`Error al solicitar reserva: ${err.message}\nConsulte la consola del navegador.`);
        }
      });
      return;
    }

    // ── PENDIENTE + gerente ───────────────────────────
    if (estado === 'Pendiente' && role === 'gerente') {
      // Find the negociación for this property
      const negs = APP5T_DB.query('negociaciones', n => n.id_propiedad === propiedad.id && n.estado_avance === 'En Curso');
      const neg = negs && negs.length ? negs[0] : null;
      const cliente = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const clienteNom = cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}` : 'Sin cliente';
      const monto = neg ? APP5T_Utils.formatMoneda(neg.pie || 0) : '$ 0';
      const precioOf = neg ? APP5T_Utils.formatMoneda(neg.valor_final || 0) : '$ 0';
      const precioLista = propiedad.valor_final || 0;
      const precioOfNum = neg ? (neg.valor_final || 0) : 0;
      const margen = precioLista > 0 ? (((precioOfNum - precioLista) / precioLista) * 100).toFixed(1) : '0.0';

      container.innerHTML = `
        <div class="form-card approval-card" style="border-left: 4px solid var(--color-warning, #f59e0b);">
          <h4><i class="fa-solid fa-stamp"></i> Aprobación de Reserva</h4>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${clienteNom}</span></div>
            <div class="info-item"><span class="info-label">Monto Reserva</span><span class="info-value">${monto}</span></div>
            <div class="info-item"><span class="info-label">Precio Ofertado</span><span class="info-value">${precioOf}</span></div>
            <div class="info-item"><span class="info-label">Margen</span><span class="info-value">${margen}%</span></div>
          </div>
          ${_group('Motivo de Rechazo (opcional)', `<textarea name="motivo_rechazo" class="form-control" rows="2" placeholder="Indique motivo si rechaza..."></textarea>`, 'motivo_rechazo')}
          <div class="btn-row" style="display:flex;gap:0.75rem;margin-top:1rem;">
            <button type="button" id="btn-aprobar" class="btn btn-success"><i class="fa-solid fa-check"></i> Aprobar</button>
            <button type="button" id="btn-rechazar" class="btn btn-danger"><i class="fa-solid fa-xmark"></i> Rechazar</button>
          </div>
        </div>`;

      container.querySelector('#btn-aprobar').addEventListener('click', () => {
        try {
          // Find a director with auth_reserva = 'S'
          const dirs = APP5T_DB.getAll('directorio') || [];
          const dirAuth = dirs.find(d => d.auth_reserva === 'S') || dirs[0];
          const idDir = dirAuth ? dirAuth.id : 0;
          if (!neg) { APP5T_Utils.showToast('No se encontró negociación asociada', 'error'); return; }
          const res = APP5T_DB.aprobarReserva(neg.id, idDir);
          if (res && !res.success) {
            APP5T_Utils.showToast(`Error al aprobar reserva: ${res.error || 'Desconocido'}`, 'error');
            return;
          }
          APP5T_Utils.showToast('Reserva aprobada exitosamente', 'success');
          if (window.APP5T && APP5T.refreshAll) APP5T.refreshAll();
          APP5T.closeModal(true);
        } catch (err) {
          console.error(err);
          alert(`Error al aprobar reserva: ${err.message}`);
        }
      });

      container.querySelector('#btn-rechazar').addEventListener('click', () => {
        try {
          const motivo = container.querySelector('[name="motivo_rechazo"]').value || 'Sin motivo especificado';
          if (!neg) { APP5T_Utils.showToast('No se encontró negociación asociada', 'error'); return; }
          const res = APP5T_DB.rechazarReserva(neg.id, motivo);
          if (res && !res.success) {
            APP5T_Utils.showToast(`Error al rechazar reserva: ${res.error || 'Desconocido'}`, 'error');
            return;
          }
          APP5T_Utils.showToast('Reserva rechazada', 'warning');
          if (window.APP5T && APP5T.refreshAll) APP5T.refreshAll();
          APP5T.closeModal(true);
        } catch (err) {
          console.error(err);
          alert(`Error al rechazar reserva: ${err.message}`);
        }
      });
      return;
    }

    // ── RESERVADA + administrador ─────────────────────
    if (estado === 'Reservada' && role === 'administrador') {
      const hoy = APP5T_Utils.fechaHoy();
      const negs = APP5T_DB.query('negociaciones', n => n.id_propiedad === propiedad.id && n.estado_avance === 'En Curso');
      const neg = negs && negs.length ? negs[0] : null;

      container.innerHTML = `
        <form id="frm-promesa" class="form-card">
          <h4><i class="fa-solid fa-file-signature"></i> Firmar Promesa de Compraventa</h4>
          ${_group('Fecha Promesa', `<input type="date" name="fecha_promesa" class="form-control" value="${hoy}">`, 'fecha_promesa')}
          ${_group('Notaría', `<input type="text" name="notaria" class="form-control" placeholder="Ej: Notaría San Carlos">`, 'notaria')}
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>
        </form>`;

      container.querySelector('#frm-promesa').addEventListener('submit', e => {
        e.preventDefault();
        try {
          const frm = e.target;
          if (!neg) { APP5T_Utils.showToast('No se encontró negociación asociada', 'error'); return; }
          const res = APP5T_DB.firmarPromesa(neg.id, {
            fecha_promesa: frm.querySelector('[name="fecha_promesa"]').value,
            notaria: frm.querySelector('[name="notaria"]').value
          });
          if (res && !res.success) {
            APP5T_Utils.showToast(`Error al firmar promesa: ${res.error || 'Desconocido'}`, 'error');
            return;
          }
          APP5T_Utils.showToast('Promesa firmada exitosamente', 'success');
          if (window.APP5T && APP5T.refreshAll) APP5T.refreshAll();
          APP5T.closeModal(true);
        } catch (err) {
          console.error(err);
          alert(`Error al firmar promesa: ${err.message}`);
        }
      });
      return;
    }

    // ── PROMESADA + administrador ─────────────────────
    if (estado === 'Promesada' && role === 'administrador') {
      const hoy = APP5T_Utils.fechaHoy();
      const negs = APP5T_DB.query('negociaciones', n => n.id_propiedad === propiedad.id);
      const neg = negs && negs.length ? negs[0] : null;

      container.innerHTML = `
        <form id="frm-escritura" class="form-card">
          <h4><i class="fa-solid fa-gavel"></i> Firmar Escritura Pública</h4>
          ${_group('Fecha Escritura', `<input type="date" name="fecha_escritura" class="form-control" value="${hoy}">`, 'fecha_escritura')}
          ${_group('Fojas', `<input type="text" name="fojas" class="form-control" placeholder="Ej: 1234">`, 'fojas')}
          ${_group('Notaría', `<input type="text" name="notaria" class="form-control" placeholder="Notaría de inscripción">`, 'notaria')}
          <button type="submit" class="btn btn-danger"><i class="fa-solid fa-scale-balanced"></i> Firmar Escritura</button>
        </form>`;

      container.querySelector('#frm-escritura').addEventListener('submit', e => {
        e.preventDefault();
        try {
          const frm = e.target;
          if (!neg) { APP5T_Utils.showToast('No se encontró negociación asociada', 'error'); return; }
          const res = APP5T_DB.firmarEscritura(neg.id, {
            fecha_escritura: frm.querySelector('[name="fecha_escritura"]').value,
            fojas: frm.querySelector('[name="fojas"]').value,
            notaria: frm.querySelector('[name="notaria"]').value
          });
          if (res && !res.success) {
            APP5T_Utils.showToast(`Error al firmar escritura: ${res.error || 'Desconocido'}`, 'error');
            return;
          }
          APP5T_Utils.showToast('Escritura firmada — Lote vendido', 'success');
          if (window.APP5T && APP5T.refreshAll) APP5T.refreshAll();
          APP5T.closeModal(true);
        } catch (err) {
          console.error(err);
          alert(`Error al firmar escritura: ${err.message}`);
        }
      });
      return;
    }

    // ── VENDIDA (any role) ────────────────────────────
    if (estado === 'Vendida') {
      const negs = APP5T_DB.query('negociaciones', n => n.id_propiedad === propiedad.id) || [];
      const neg = negs.length ? negs[negs.length - 1] : null;
      const cliente = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      container.innerHTML = `
        <div class="form-card locked-panel">
          <div class="locked-icon"><i class="fa-solid fa-lock"></i></div>
          <h4>LOTE VENDIDO — Escritura inscrita</h4>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${cliente ? `${cliente.nombres} ${cliente.apellidos}` : '—'}</span></div>
            <div class="info-item"><span class="info-label">Precio Final</span><span class="info-value">${APP5T_Utils.formatMoneda(neg ? neg.valor_final : propiedad.valor_final)}</span></div>
            <div class="info-item"><span class="info-label">Fecha Venta</span><span class="info-value">${propiedad.fecha_venta || '—'}</span></div>
          </div>
        </div>`;
      return;
    }

    // ── DEFAULT: No permissions ───────────────────────
    container.innerHTML = `
      <div class="form-card info-panel">
        <i class="fa-solid fa-circle-info"></i>
        <p>No tienes permisos para esta acción en el estado actual del lote.</p>
        <small>Estado: <strong>${estado}</strong> | Rol: <strong>${role}</strong></small>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════
     renderCRUDTable
     ══════════════════════════════════════════════════════ */
  function renderCRUDTable(container, entity) {
    if (!container) return;
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) { container.innerHTML = '<p class="text-muted">Entidad no soportada.</p>'; return; }

    const records = APP5T_DB.getAll(entity) || [];
    const visibleFields = schema.fields.slice(0, 6); // Show first 6 columns in table

    // ── Build table ──
    let thead = '<tr><th>#</th>';
    visibleFields.forEach(f => { thead += `<th>${f.label}</th>`; });
    thead += '<th class="text-center">Acciones</th></tr>';

    let tbody = '';
    if (records.length === 0) {
      tbody = `<tr><td colspan="${visibleFields.length + 2}" class="text-center text-muted">Sin registros</td></tr>`;
    } else {
      records.forEach((rec, idx) => {
        const pk = rec[schema.pk] || rec.id || idx;
        tbody += `<tr><td>${idx + 1}</td>`;
        visibleFields.forEach(f => {
          let val = rec[f.key] || '';
          if (f.type === 'ref') {
            const refRec = APP5T_DB.getById(f.ref, val);
            val = refRec ? (refRec[f.refLabel] || refRec.nombre || val) : val;
          }
          tbody += `<td>${val}</td>`;
        });
        tbody += `<td class="text-center">
          <button class="btn btn-sm btn-outline" onclick="APP5T_Forms._editRecord('${entity}','${pk}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm btn-outline btn-outline-danger" onclick="APP5T_Forms._deleteRecord('${entity}','${pk}')"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
      });
    }

    container.innerHTML = `
      <div class="crud-toolbar">
        <h4><i class="fa-solid fa-table-list"></i> ${schema.label}s (${records.length})</h4>
        <button class="btn btn-primary btn-sm" onclick="APP5T_Forms._addRecord('${entity}')">
          <i class="fa-solid fa-plus"></i> Agregar
        </button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>${thead}</thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>`;
  }

  /* ── CRUD Modal Helpers ── */

  function _buildFormHTML(schema, record) {
    const isEdit = !!record;
    let html = `<form id="frm-crud" class="form-grid">`;
    schema.fields.forEach(f => {
      const val = isEdit ? (record[f.key] || '') : (f.default || '');
      const reqAttr = f.required ? 'required' : '';
      let input = '';
      switch (f.type) {
        case 'select':
          input = `<select name="${f.key}" class="form-control" ${reqAttr}>
            <option value="">— Seleccionar —</option>
            ${(f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>`;
          break;
        case 'ref':
          input = _refSelect(f.key, f.ref, f.refLabel, val);
          break;
        case 'textarea':
          input = `<textarea name="${f.key}" class="form-control" rows="3" ${reqAttr}>${val}</textarea>`;
          break;
        case 'date':
          input = `<input type="date" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
          break;
        case 'number':
          input = `<input type="number" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
          break;
        default:
          input = `<input type="${f.type || 'text'}" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
      }
      html += _group(f.label + (f.required ? ' *' : ''), input, f.key);
    });
    html += `<div class="form-actions">
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> ${isEdit ? 'Actualizar' : 'Guardar'}</button>
    </div></form>`;
    return html;
  }

  function _addRecord(entity) {
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) return;
    const html = _buildFormHTML(schema, null);
    APP5T.openModal(`Agregar ${schema.label}`, html);
    const frm = document.getElementById('frm-crud');
    frm.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const result = _collectForm(frm, schema);
        if (!result.ok) { APP5T_Utils.showToast(result.errors[0], 'warning'); return; }
        // Generate ID
        const existing = APP5T_DB.getAll(entity) || [];
        result.data[schema.pk] = APP5T_Utils.generarId(existing);
        result.data.fecha_ingreso = result.data.fecha_ingreso || APP5T_Utils.fechaHoy();
        const res = APP5T_DB.insert(entity, result.data);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al guardar: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast(`${schema.label} agregado correctamente`, 'success');
        APP5T.closeModal(true);
        // Re-render the CRUD table
        const crudContent = document.getElementById('crud-content');
        if (crudContent) renderCRUDTable(crudContent, entity);
      } catch (err) {
        console.error(err);
        alert(`Error al guardar registro: ${err.message}\nConsulte la consola del navegador para más detalles.`);
      }
    });
  }

  function _editRecord(entity, id) {
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) return;
    const record = APP5T_DB.getById(entity, id);
    if (!record) { APP5T_Utils.showToast('Registro no encontrado', 'error'); return; }
    const html = _buildFormHTML(schema, record);
    APP5T.openModal(`Editar ${schema.label}`, html);
    const frm = document.getElementById('frm-crud');
    frm.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const result = _collectForm(frm, schema);
        if (!result.ok) { APP5T_Utils.showToast(result.errors[0], 'warning'); return; }
        const res = APP5T_DB.update(entity, id, result.data);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al actualizar: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast(`${schema.label} actualizado correctamente`, 'success');
        APP5T.closeModal(true);
        const crudContent = document.getElementById('crud-content');
        if (crudContent) renderCRUDTable(crudContent, entity);
      } catch (err) {
        console.error(err);
        alert(`Error al actualizar registro: ${err.message}\nConsulte la consola del navegador para más detalles.`);
      }
    });
  }

  function _deleteRecord(entity, id) {
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) return;
    if (!confirm(`¿Eliminar este ${schema.label}?`)) return;
    APP5T_DB.remove(entity, id);
    APP5T_Utils.showToast(`${schema.label} eliminado`, 'info');
    const crudContent = document.getElementById('crud-content');
    if (crudContent) renderCRUDTable(crudContent, entity);
  }

  /* ══════════════════════════════════════════════════════
     renderPagoForm
     ══════════════════════════════════════════════════════ */
  function renderPagoForm(container, ctaCte) {
    if (!container || !ctaCte) return;
    const hoy = APP5T_Utils.fechaHoy();

    container.innerHTML = `
      <form id="frm-pago" class="form-card">
        <h4><i class="fa-solid fa-money-check-dollar"></i> Registrar Pago</h4>
        <div class="info-grid" style="margin-bottom:1rem;">
          <div class="info-item"><span class="info-label">Cuota</span><span class="info-value">#${ctaCte.cuota_nro || '—'}</span></div>
          <div class="info-item"><span class="info-label">Valor Cuota</span><span class="info-value">${APP5T_Utils.formatMoneda(ctaCte.valor_cuota || 0)}</span></div>
        </div>
        ${_group('Valor Pagado', `<input type="text" name="valor_pagado" class="form-control" value="${APP5T_Utils.formatMoneda(ctaCte.valor_cuota || 0)}">`, 'valor_pagado')}
        ${_group('Fecha de Pago', `<input type="date" name="fecha_pago" class="form-control" value="${hoy}">`, 'fecha_pago')}
        ${_group('URL Comprobante', `<input type="url" name="url_comprobante" class="form-control" placeholder="https://...">`, 'url_comprobante')}
        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-receipt"></i> Registrar Pago</button>
      </form>`;

    container.querySelector('#frm-pago').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const frm = e.target;
        const valorPagado = APP5T_Utils.parseMoneda(frm.querySelector('[name="valor_pagado"]').value);
        const fechaPago = frm.querySelector('[name="fecha_pago"]').value;
        const url = frm.querySelector('[name="url_comprobante"]').value;

        if (!valorPagado || valorPagado <= 0) {
          APP5T_Utils.showToast('Ingrese un valor de pago válido', 'warning');
          return;
        }

        const res = APP5T_DB.registrarPago(ctaCte.id, valorPagado, fechaPago, url);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al registrar pago: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast('Pago registrado exitosamente', 'success');
        if (window.APP5T && APP5T.refreshAll) APP5T.refreshAll();
        APP5T.closeModal(true);
      } catch (err) {
        console.error(err);
        alert(`Error al registrar pago: ${err.message}`);
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════ */
  const api = { renderLoteForm, renderCRUDTable, renderPagoForm, _addRecord, _editRecord, _deleteRecord };
  window.APP5T_Forms = api;
  return api;
})();
