/**
 * =====================================================
 * CODIGO.GS — APP_5T Backend Exclusivo
 * CRM & GIS Unificado — 5 Tierras
 * =====================================================
 * 
 * VINCULADO A LA PLANILLA:
 * https://docs.google.com/spreadsheets/d/1LidejaAu8P8ERSgAiJP0uQT9SaLQXRT2gFBHRq_VClE/edit
 * 
 * INSTRUCCIONES:
 * 1. Abrir la planilla de Google Sheets vinculada arriba.
 * 2. Ir a Extensiones → Apps Script.
 * 3. Pegar TODO este código en Código.gs (reemplazando cualquier contenido previo).
 * 4. Ejecutar la función inicializarHojas() UNA VEZ en el editor de script para crear las tablas.
 * 5. Hacer clic en Implementar → Nueva implementación → Seleccionar tipo: App web.
 *    - Ejecutar como: Yo (tu_correo@gmail.com)
 *    - Acceso: Cualquier persona (Anyone)
 * 6. Copiar la "URL de la aplicación web" generada (ej. https://script.google.com/macros/s/.../exec).
 * 7. Reemplazar esa URL en la constante APPS_SCRIPT_URL dentro de 02_GESTION/index.html.
 * =====================================================
 */

// ══════════════════════════════════════════════════════
// CONFIGURACIÓN DE TABLAS
// ══════════════════════════════════════════════════════

const TABLAS = {
  Vendedores: [
    'Id_vendedor', 'Rut_vendedor', 'Nombre_vendedor', 'Fecha_ingreso',
    'Ciudad', 'Telefono', 'Correo_electronico', 'Cargo', 'Estado'
  ],
  Clientes: [
    'Id_cliente', 'Rut_cliente', 'Nombres', 'Apellidos', 'Fecha_nacimiento',
    'Direccion', 'Comuna', 'Telefono', 'Correo_electronico', 'Estado_civil',
    'Regimen_matrimonial', 'Fecha_ingreso', 'Canal_captacion', 'Vendedor_assigned',
    'Motivo_busqueda', 'Notas', 'Historial', 'Estado_cliente'
  ],
  Proyectos: [
    'Id_proyecto', 'Nombre_proyecto', 'Ubicacion', 'Comuna', 'Coordenadas',
    'Superficie', 'Rol', 'Deslindes', 'Infraestructura', 'Caracteristicas',
    'Fecha_DOM', 'Fecha_ingreso', 'Estado_proyecto', 'Nro_etapas', 'Url'
  ],
  Etapas: [
    'Id_etapa', 'Id_proyecto', 'Nombre_etapa', 'Nro_lotes', 'Superficie',
    'Fecha_ingreso', 'Fecha_DOM', 'Estado_etapa', 'Fecha_inicio', 'Fecha_cierre', 'Url'
  ],
  Propiedades: [
    'Id_propiedad', 'Id_etapa', 'Nombre_propiedad', 'Rol_propiedad', 'Superficie',
    'Valor_final', 'Fecha_ingreso', 'Deslindes', 'Infraestructura',
    'Fecha_reserva', 'Fecha_fin_promesa', 'Fecha_venta', 'Url', 'Estado'
  ],
  Directorio: [
    'Id_director', 'Rut_director', 'Nombre_director', 'Cargo', 'Telefono',
    'Correo_electronico', 'Fecha_ingreso', 'Estado', 'Autorizacion_reserva',
    'Firma_reserva', 'Autorizacion_promesa', 'Firma_promesa',
    'Autorizacion_venta', 'Firma_venta'
  ],
  Negociaciones: [
    'Id_negociacion', 'Id_propiedad', 'Id_vendedor', 'Id_cliente',
    'Fecha_negociacion', 'Valor_final', 'Pie', 'Cantidad_cuotas',
    'Fecha_vencimiento_cuota', 'Tipo_moneda', 'Url', 'Estado_avance',
    'Reajuste', 'Id_proceso'
  ],
  Cuenta_Corriente: [
    'Id_ctacte', 'Id_cliente', 'Id_propiedad', 'Cuota_nro', 'Valor_cuota',
    'Fecha_vencimiento', 'Valor_pagado', 'Fecha_pago', 'Url', 'Estado_cuota'
  ],
  Auditoria: [
    'Fecha', 'Usuario', 'Rol', 'Tabla', 'Accion', 'Registro_id', 'Detalle'
  ]
};

// Colores de encabezado por tabla
const COLORES_HEADER = {
  Vendedores:       '#2563eb', // Azul
  Clientes:         '#7c3aed', // Violeta
  Proyectos:        '#059669', // Verde
  Etapas:           '#0891b2', // Cyan
  Propiedades:      '#d97706', // Amber
  Directorio:       '#dc2626', // Rojo
  Negociaciones:    '#ea580c', // Naranja
  Cuenta_Corriente: '#4f46e5', // Indigo
  Auditoria:        '#6b7280'  // Gris
};

// Nombre de la columna PK por tabla
const PK_COLUMNA = {
  Vendedores:       'Id_vendedor',
  Clientes:         'Id_cliente',
  Proyectos:        'Id_proyecto',
  Etapas:           'Id_etapa',
  Propiedades:      'Id_propiedad',
  Directorio:       'Id_director',
  Negociaciones:    'Id_negociacion',
  Cuenta_Corriente: 'Id_ctacte'
};


// ══════════════════════════════════════════════════════
// INICIALIZACIÓN (EJECUTAR UNA VEZ)
// ══════════════════════════════════════════════════════

/**
 * Crea las 9 hojas con encabezados formateados.
 * Ejecutar manualmente desde el editor de Apps Script.
 */
function inicializarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.entries(TABLAS).forEach(([nombreTabla, columnas]) => {
    let sheet = ss.getSheetByName(nombreTabla);
    
    if (!sheet) {
      sheet = ss.insertSheet(nombreTabla);
      Logger.log('✅ Hoja creada: ' + nombreTabla);
    }
    
    // Escribir encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, columnas.length).setValues([columnas]);
      
      // Formato del encabezado
      const headerRange = sheet.getRange(1, 1, 1, columnas.length);
      headerRange.setFontWeight('bold');
      headerRange.setFontColor('#ffffff');
      headerRange.setBackground(COLORES_HEADER[nombreTabla] || '#374151');
      headerRange.setHorizontalAlignment('center');
      headerRange.setFontSize(10);
      
      // Congelar fila de encabezado
      sheet.setFrozenRows(1);
      
      // Ajustar ancho de columnas
      columnas.forEach((col, idx) => {
        const width = col.length > 15 ? 180 : col.length > 10 ? 140 : 100;
        sheet.setColumnWidth(idx + 1, width);
      });
      
      Logger.log('  → Encabezados escritos para: ' + nombreTabla);
    }
  });
  
  // Eliminar la hoja por defecto si existe
  const defaultSheet = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
      Logger.log('🗑️ Hoja por defecto eliminada');
    } catch(e) {
      // Ignorar si no se puede eliminar
    }
  }
  
  Logger.log('');
  Logger.log('══════════════════════════════════════');
  Logger.log('✅ INICIALIZACIÓN COMPLETA');
  Logger.log('   Hojas creadas: ' + Object.keys(TABLAS).length);
  Logger.log('   Próximo paso: Implementar como Web App');
  Logger.log('══════════════════════════════════════');
}


// ══════════════════════════════════════════════════════
// ENDPOINT GET — LECTURA DE DATOS
// ══════════════════════════════════════════════════════

function doGet(e) {
  try {
    const action = (e.parameter.action || 'read').toLowerCase();
    const tabla = e.parameter.tabla || '';
    const id = e.parameter.id || '';
    
    switch (action) {
      case 'read':
        if (!tabla) return respError('Parámetro "tabla" requerido', 400);
        return leerTabla(tabla);
        
      case 'readbyid':
        if (!tabla || !id) return respError('Parámetros "tabla" e "id" requeridos', 400);
        return leerRegistro(tabla, id);
        
      case 'readall':
        return leerTodasLasTablas();
        
      case 'ping':
        return respOk({ status: 'online', app: 'APP_5T', version: '1.0.0', timestamp: new Date().toISOString() });
        
      default:
        return respError('Acción GET no reconocida: ' + action, 400);
    }
  } catch (err) {
    return respError('Error interno GET: ' + err.message, 500);
  }
}


// ══════════════════════════════════════════════════════
// ENDPOINT POST — ESCRITURA DE DATOS
// ══════════════════════════════════════════════════════

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = (body.action || 'insert').toLowerCase();
    const tabla = body.tabla || '';
    
    if (!tabla && action !== 'syncall') {
      return respError('Campo "tabla" requerido en el body', 400);
    }
    
    switch (action) {
      case 'insert':
        return insertarRegistro(tabla, body.data || {}, body.usuario || 'Sistema');
        
      case 'update':
        if (!body.id && body.id !== 0) return respError('Campo "id" requerido para update', 400);
        return actualizarRegistro(tabla, body.id, body.data || {}, body.usuario || 'Sistema');
        
      case 'delete':
        if (!body.id && body.id !== 0) return respError('Campo "id" requerido para delete', 400);
        return eliminarRegistro(tabla, body.id, body.usuario || 'Sistema');
        
      case 'sync':
        if (!body.registros || !Array.isArray(body.registros)) {
          return respError('Campo "registros" (array) requerido para sync', 400);
        }
        return sincronizarTabla(tabla, body.registros, body.usuario || 'Sistema');
        
      case 'syncall':
        if (!body.datos || typeof body.datos !== 'object') {
          return respError('Campo "datos" (objeto) requerido para syncAll', 400);
        }
        return sincronizarTodo(body.datos, body.usuario || 'Sistema');
        
      default:
        return respError('Acción POST no reconocida: ' + action, 400);
    }
  } catch (err) {
    return respError('Error interno POST: ' + err.message, 500);
  }
}


// ══════════════════════════════════════════════════════
// OPERACIONES CRUD
// ══════════════════════════════════════════════════════

/**
 * LEER — Todos los registros de una tabla
 */
function leerTabla(nombreTabla) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return respOk({ tabla: nombreTabla, registros: [], total: 0 });
  
  const headers = data[0];
  const registros = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = data[i][idx];
    });
    registros.push(row);
  }
  
  return respOk({ tabla: nombreTabla, registros: registros, total: registros.length });
}

/**
 * LEER — Un registro por ID
 */
function leerRegistro(nombreTabla, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol) return respError('Tabla sin PK definida: ' + nombreTabla, 400);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pkIdx = headers.indexOf(pkCol);
  
  if (pkIdx === -1) return respError('Columna PK "' + pkCol + '" no encontrada', 500);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][pkIdx]) === String(id)) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = data[i][idx]; });
      return respOk({ tabla: nombreTabla, registro: row });
    }
  }
  
  return respError('Registro con ' + pkCol + '=' + id + ' no encontrado', 404);
}

/**
 * LEER — Todas las tablas (excepto Auditoría)
 */
function leerTodasLasTablas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultado = {};
  
  Object.keys(TABLAS).forEach(nombreTabla => {
    if (nombreTabla === 'Auditoria') return; // No enviar auditoría al cliente
    
    const sheet = ss.getSheetByName(nombreTabla);
    if (!sheet) {
      resultado[nombreTabla] = [];
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      resultado[nombreTabla] = [];
      return;
    }
    
    const headers = data[0];
    const registros = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = data[i][idx]; });
      registros.push(row);
    }
    resultado[nombreTabla] = registros;
  });
  
  return respOk(resultado);
}

/**
 * INSERTAR — Nuevo registro en una tabla
 */
function insertarRegistro(nombreTabla, data, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const columnas = TABLAS[nombreTabla];
  if (!columnas) return respError('Esquema de tabla no definido: ' + nombreTabla, 400);
  
  // Generar ID autoincremental
  const pkCol = PK_COLUMNA[nombreTabla];
  let nuevoId = data[pkCol];
  
  if (pkCol && (!nuevoId || nuevoId === 0)) {
    nuevoId = obtenerSiguienteId(sheet, columnas.indexOf(pkCol));
    data[pkCol] = nuevoId;
  }
  
  // Construir fila según el orden de columnas
  const newRow = columnas.map(col => {
    const val = data[col];
    if (val === undefined || val === null) return '';
    return val;
  });
  
  sheet.appendRow(newRow);
  
  // Auditoría
  registrarAuditoria(usuario, '', nombreTabla, 'INSERT', nuevoId, 
    'Nuevo registro creado: ' + JSON.stringify(data).substring(0, 200));
  
  return respOk({ success: true, id: nuevoId, tabla: nombreTabla });
}

/**
 * ACTUALIZAR — Modificar campos de un registro existente
 */
function actualizarRegistro(nombreTabla, id, data, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const columnas = TABLAS[nombreTabla];
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol) return respError('Tabla sin PK definida: ' + nombreTabla, 400);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const pkIdx = headers.indexOf(pkCol);
  
  if (pkIdx === -1) return respError('Columna PK no encontrada', 500);
  
  // Buscar fila del registro
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][pkIdx]) === String(id)) {
      rowIndex = i;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return respError('Registro con ' + pkCol + '=' + id + ' no encontrado', 404);
  }
  
  const sheetRow = rowIndex + 1; // Fila real en la hoja (1-indexed)
  const cambios = [];
  
  // Actualizar solo los campos enviados
  Object.entries(data).forEach(([campo, valor]) => {
    const colIdx = headers.indexOf(campo);
    if (colIdx === -1) return; // Ignorar campos que no existen
    if (campo === pkCol) return; // No modificar la PK
    
    const valorAnterior = allData[rowIndex][colIdx];
    if (String(valorAnterior) !== String(valor)) {
      sheet.getRange(sheetRow, colIdx + 1).setValue(valor === null ? '' : valor);
      cambios.push(campo + ': ' + valorAnterior + ' → ' + valor);
    }
  });
  
  if (cambios.length > 0) {
    registrarAuditoria(usuario, '', nombreTabla, 'UPDATE', id, cambios.join(' | '));
  }
  
  return respOk({ success: true, id: id, tabla: nombreTabla, cambios: cambios.length });
}

/**
 * ELIMINAR — Borrar un registro por ID
 */
function eliminarRegistro(nombreTabla, id, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol) return respError('Tabla sin PK definida', 400);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const pkIdx = headers.indexOf(pkCol);
  
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][pkIdx]) === String(id)) {
      rowIndex = i;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return respError('Registro no encontrado', 404);
  }
  
  // Guardar datos antes de eliminar para auditoría
  const registro = {};
  headers.forEach((h, idx) => { registro[h] = allData[rowIndex][idx]; });
  
  sheet.deleteRow(rowIndex + 1);
  
  registrarAuditoria(usuario, '', nombreTabla, 'DELETE', id,
    'Registro eliminado: ' + JSON.stringify(registro).substring(0, 200));
  
  return respOk({ success: true, id: id, tabla: nombreTabla });
}


// ══════════════════════════════════════════════════════
// SINCRONIZACIÓN MASIVA
// ══════════════════════════════════════════════════════

/**
 * SYNC — Sincronizar una tabla completa (upsert masivo)
 * Recibe un array de registros. Para cada uno:
 * - Si el ID existe → UPDATE
 * - Si el ID no existe → INSERT
 */
function sincronizarTabla(nombreTabla, registros, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const columnas = TABLAS[nombreTabla];
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol || !columnas) return respError('Configuración de tabla inválida', 400);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const pkIdx = headers.indexOf(pkCol);
  
  // Crear mapa de IDs existentes → fila
  const existingMap = {};
  for (let i = 1; i < allData.length; i++) {
    existingMap[String(allData[i][pkIdx])] = i + 1; // fila real (1-indexed)
  }
  
  let insertados = 0;
  let actualizados = 0;
  
  registros.forEach(reg => {
    const id = String(reg[pkCol] || '');
    
    if (id && existingMap[id]) {
      // UPDATE existente
      const sheetRow = existingMap[id];
      columnas.forEach((col, colIdx) => {
        if (col === pkCol) return;
        if (reg[col] !== undefined) {
          sheet.getRange(sheetRow, colIdx + 1).setValue(reg[col] === null ? '' : reg[col]);
        }
      });
      actualizados++;
    } else {
      // INSERT nuevo
      const newRow = columnas.map(col => {
        const val = reg[col];
        return (val === undefined || val === null) ? '' : val;
      });
      sheet.appendRow(newRow);
      insertados++;
    }
  });
  
  registrarAuditoria(usuario, '', nombreTabla, 'SYNC',
    insertados + '+' + actualizados,
    'Sync masiva: ' + insertados + ' insertados, ' + actualizados + ' actualizados');
  
  return respOk({
    success: true,
    tabla: nombreTabla,
    insertados: insertados,
    actualizados: actualizados,
    total: registros.length
  });
}

/**
 * SYNC ALL — Sincronizar todas las tablas de una vez
 * Body: { datos: { Vendedores: [...], Clientes: [...], ... } }
 */
function sincronizarTodo(datos, usuario) {
  const resultados = {};
  
  Object.entries(datos).forEach(([tabla, registros]) => {
    if (!TABLAS[tabla] || tabla === 'Auditoria') return;
    if (!Array.isArray(registros)) return;
    
    try {
      const res = sincronizarTabla(tabla, registros, usuario);
      const parsed = JSON.parse(res.getContent());
      resultados[tabla] = parsed;
    } catch (err) {
      resultados[tabla] = { error: err.message };
    }
  });
  
  return respOk({ success: true, resultados: resultados });
}


// ══════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ══════════════════════════════════════════════════════

/**
 * Obtener el siguiente ID autoincremental para una tabla
 */
function obtenerSiguienteId(sheet, pkColIndex) {
  if (pkColIndex < 0) return 1;
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1; // Solo encabezado
  
  const valores = sheet.getRange(2, pkColIndex + 1, lastRow - 1, 1).getValues();
  let maxId = 0;
  
  valores.forEach(row => {
    const val = parseInt(row[0], 10);
    if (!isNaN(val) && val > maxId) maxId = val;
  });
  
  return maxId + 1;
}

/**
 * Registrar acción en la hoja de Auditoría
 */
function registrarAuditoria(usuario, rol, tabla, accion, registroId, detalle) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName('Auditoria');
    if (!auditSheet) return;
    
    const fecha = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'dd/MM/yyyy HH:mm:ss'
    );
    
    auditSheet.appendRow([
      fecha,
      usuario || 'Sistema',
      rol || '',
      tabla || '',
      accion || '',
      String(registroId || ''),
      String(detalle || '').substring(0, 500) // Limitar largo
    ]);
    
    // Mantener auditoría en tamaño razonable (máx 5000 filas)
    const totalRows = auditSheet.getLastRow();
    if (totalRows > 5001) {
      auditSheet.deleteRows(2, totalRows - 5001);
    }
  } catch (e) {
    // No fallar por error de auditoría
    Logger.log('Error de auditoría: ' + e.message);
  }
}

/**
 * Respuesta JSON exitosa
 */
function respOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Respuesta JSON de error
 */
function respError(mensaje, codigo) {
  return ContentService
    .createTextOutput(JSON.stringify({
      error: true,
      mensaje: mensaje,
      codigo: codigo || 500
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ══════════════════════════════════════════════════════
// FUNCIONES DE MANTENIMIENTO (opcionales)
// ══════════════════════════════════════════════════════

/**
 * Reinicializar una tabla específica (CUIDADO: borra todos los datos)
 */
function reinicializarTabla(nombreTabla) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) {
    Logger.log('Tabla no encontrada: ' + nombreTabla);
    return;
  }
  
  const columnas = TABLAS[nombreTabla];
  if (!columnas) {
    Logger.log('Esquema no definido para: ' + nombreTabla);
    return;
  }
  
  // Borrar todo excepto encabezado
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  Logger.log('🗑️ Tabla reinicializada: ' + nombreTabla + ' (encabezados preservados)');
}

/**
 * Ver estadísticas de todas las tablas
 */
function verEstadisticas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('══════════════════════════════════════');
  Logger.log('📊 ESTADÍSTICAS APP_5T');
  Logger.log('══════════════════════════════════════');
  
  Object.keys(TABLAS).forEach(tabla => {
    const sheet = ss.getSheetByName(tabla);
    if (sheet) {
      const rows = Math.max(0, sheet.getLastRow() - 1);
      Logger.log('  ' + tabla + ': ' + rows + ' registros');
    } else {
      Logger.log('  ' + tabla + ': ⚠️ HOJA NO ENCONTRADA');
    }
  });
  
  Logger.log('══════════════════════════════════════');
}
