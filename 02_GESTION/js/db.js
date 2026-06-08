/**
 * ============================================================
 *  5 Tierras — APP5T_DB
 *  Módulo de base de datos local (localStorage)
 *  Versión: v1.0.0
 *  Fecha: 2026-06-05
 * ============================================================
 *  Simula una base de datos relacional completa con CRUD
 *  genérico, workflows de negociación inmobiliaria (reserva →
 *  promesa → escritura), cuenta corriente con cuotas, y
 *  estadísticas de proyecto.
 *
 *  Depende de: APP5T_Utils (utils.js — debe cargarse primero)
 * ============================================================
 */
var APP5T_DB = (function () {
    'use strict';

    // ───────────────────── CONSTANTES ─────────────────────

    var DB_VERSION = 'v1.0.2';
    var KEY_PREFIX = 'app5t_';
    var TABLES = [
        'vendedores',
        'clientes',
        'proyectos',
        'etapas',
        'propiedades',
        'directorio',
        'negociaciones',
        'cuenta_corriente',
        'auditoria'
    ];

    // ───────────────────── SCHEMAS ESTRICTOS (PRD) ─────────────────────
    const SCHEMAS = {
        vendedores: {
            rut: 'string', nombre: 'string', fecha_ingreso: 'string',
            ciudad: 'string', telefono: 'string', email: 'string',
            cargo: 'string', estado: 'string'
        },
        clientes: {
            rut: 'string', nombres: 'string', apellidos: 'string', fecha_nacimiento: 'string',
            direccion: 'string', comuna: 'string', telefono: 'string', email: 'string',
            estado_civil: 'string', regimen_matrimonial: 'string', fecha_ingreso: 'string',
            canal_captacion: 'string', id_vendedor: 'number', motivo_busqueda: 'string',
            notas: 'string', historial: 'string', estado_cliente: 'string'
        },
        proyectos: {
            nombre_proyecto: 'string', nombre: 'string', ubicacion: 'string', comuna: 'string', coordenadas_centro: 'object',
            superficie: 'number', rol: 'string', deslindes: 'string', infraestructura: 'string',
            caracteristicas: 'string', fecha_dom: 'string', fecha_ingreso: 'string',
            estado_proyecto: 'string', nro_etapas: 'number', url: 'string'
        },
        etapas: {
            id_proyecto: 'number', nombre_etapa: 'string', nombre: 'string', nro_lotes: 'number', superficie: 'number',
            fecha_ingreso: 'string', fecha_dom: 'string', estado_etapa: 'string', fecha_inicio: 'string',
            fecha_cierre: 'string', url: 'string'
        },
        propiedades: {
            id_etapa: 'number', id_proyecto: 'number', nombre: 'string', rol: 'string',
            superficie: 'number', coordenadas: 'object', valor_final: 'number', fecha_ingreso: 'string',
            deslindes: 'string', infraestructura: 'string', fecha_reserva: 'string',
            fecha_fin_promesa: 'string', fecha_venta: 'string', url: 'string', estado: 'string'
        },
        directorio: {
            rut: 'string', nombre: 'string', cargo: 'string', telefono: 'string',
            email: 'string', fecha_ingreso: 'string', estado: 'string',
            auth_reserva: 'string', firma_reserva: 'string', auth_promesa: 'string',
            firma_promesa: 'string', auth_venta: 'string', firma_venta: 'string'
        },
        negociaciones: {
            id_propiedad: 'number', id_vendedor: 'number', id_cliente: 'number', fecha_negociacion: 'string',
            valor_final: 'number', pie: 'number', cantidad_cuotas: 'number', fecha_vencimiento_cuota: 'string',
            tipo_moneda: 'string', url: 'string', estado_avance: 'string', reajuste: 'number', id_proceso: 'string'
        },
        cuenta_corriente: {
            id_cliente: 'number', id_propiedad: 'number', cuota_nro: 'number', valor_cuota: 'number',
            fecha_vencimiento: 'string', valor_pagado: 'number', fecha_pago: 'string', url: 'string',
            estado_cuota: 'string'
        }
    };

    function _validateSchema(tabla, data) {
        if (!SCHEMAS[tabla]) return data; // Skip tables without schema (e.g. auditoria)
        const schema = SCHEMAS[tabla];
        const validData = {};
        for (let key in schema) {
            if (data[key] !== undefined) {
                // strict cast
                if (schema[key] === 'number') validData[key] = Number(data[key]) || 0;
                else if (schema[key] === 'string') validData[key] = String(data[key] || '');
                else validData[key] = data[key];
            } else {
                // defaults
                if (schema[key] === 'number') validData[key] = 0;
                else if (schema[key] === 'string') validData[key] = '';
                else validData[key] = null;
            }
        }
        return validData;
    }

    // ───────────────────── HELPERS INTERNOS ─────────────────────

    /** Genera la clave de localStorage para una tabla */
    function _getKey(tabla) {
        return KEY_PREFIX + tabla;
    }

    /** Carga un arreglo desde localStorage */
    function _load(tabla) {
        try {
            return JSON.parse(localStorage.getItem(_getKey(tabla))) || [];
        } catch (e) {
            return [];
        }
    }

    /** Persiste un arreglo en localStorage */
    function _save(tabla, data) {
        localStorage.setItem(_getKey(tabla), JSON.stringify(data));
    }

    // ───────────────────── CRUD GENÉRICO ─────────────────────

    /**
     * Retorna todos los registros de una tabla.
     * @param {string} tabla
     * @returns {Array}
     */
    function getAll(tabla) {
        return _load(tabla);
    }

    /**
     * Busca un registro por su ID numérico.
     * @param {string} tabla
     * @param {number} id
     * @returns {Object|null}
     */
    function getById(tabla, id) {
        var items = _load(tabla);
        id = parseInt(id, 10);
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) return items[i];
        }
        return null;
    }

    /**
     * Inserta un nuevo registro. El ID se genera automáticamente.
     * @param {string} tabla
     * @param {Object} data
     * @returns {{success:boolean, id:number, error:string}}
     */
    function _getActiveUser() {
        if (window.APP5T && typeof window.APP5T.getActiveUser === 'function') {
            return window.APP5T.getActiveUser();
        }
        return 'Sistema';
    }

    function _getActiveRole() {
        if (window.APP5T && typeof window.APP5T.getActiveRole === 'function') {
            return window.APP5T.getActiveRole();
        }
        return 'Sistema';
    }

    /**
     * Inserta un nuevo registro. El ID se genera automáticamente.
     * @param {string} tabla
     * @param {Object} data
     * @returns {{success:boolean, id:number, error:string}}
     */
    function insert(tabla, data) {
        try {
            var items = _load(tabla);
            var safeData = _validateSchema(tabla, data);
            safeData.id = APP5T_Utils.generarId(items);
            items.push(safeData);
            _save(tabla, items);

            // Auditoría
            var u = _getActiveUser();
            var r = _getActiveRole();
            logAudit(u, r, tabla, 'Insertar', safeData.id, JSON.stringify(safeData));

            // Sincronización
            if (typeof APP5T_Sync !== 'undefined') {
                APP5T_Sync.pushRecord(tabla, 'insert', safeData, u);
            }

            return { success: true, id: safeData.id };
        } catch (e) {
            return { success: false, id: null, error: e.message };
        }
    }

    /**
     * Actualiza campos de un registro existente (merge).
     * @param {string} tabla
     * @param {number} id
     * @param {Object} data — campos a actualizar
     * @returns {{success:boolean, error:string}}
     */
    function update(tabla, id, data) {
        try {
            var items = _load(tabla);
            id = parseInt(id, 10);
            var idx = -1;
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === id) { idx = i; break; }
            }
            if (idx === -1) return { success: false, error: 'Registro no encontrado' };

            // Merge preservando id y validando esquema
            var merged = Object.assign({}, items[idx], data);
            var safeData = _validateSchema(tabla, merged);
            safeData.id = id;
            
            items[idx] = safeData;
            _save(tabla, items);

            // Auditoría
            var u = _getActiveUser();
            var r = _getActiveRole();
            logAudit(u, r, tabla, 'Actualizar', id, JSON.stringify(data));

            // Sincronización
            if (typeof APP5T_Sync !== 'undefined') {
                APP5T_Sync.pushRecord(tabla, 'update', safeData, u);
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Elimina un registro por ID.
     * @param {string} tabla
     * @param {number} id
     * @returns {{success:boolean, error:string}}
     */
    function remove(tabla, id) {
        try {
            var items = _load(tabla);
            id = parseInt(id, 10);
            var original = items.length;
            var filtered = items.filter(function (item) {
                return item.id !== id;
            });
            if (filtered.length === original) {
                return { success: false, error: 'Registro no encontrado' };
            }
            _save(tabla, filtered);

            // Auditoría
            var u = _getActiveUser();
            var r = _getActiveRole();
            logAudit(u, r, tabla, 'Eliminar', id, 'Registro ID: ' + id);

            // Sincronización
            if (typeof APP5T_Sync !== 'undefined') {
                APP5T_Sync.pushRecord(tabla, 'delete', { id: id }, u);
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Filtra registros con una función personalizada.
     * @param {string} tabla
     * @param {Function} filterFn
     * @returns {Array}
     */
    function query(tabla, filterFn) {
        return _load(tabla).filter(filterFn);
    }

    /**
     * Cuenta registros, opcionalmente filtrados.
     * @param {string} tabla
     * @param {Function} [filterFn]
     * @returns {number}
     */
    function count(tabla, filterFn) {
        if (filterFn) return query(tabla, filterFn).length;
        return _load(tabla).length;
    }

    // ═══════════════════════════════════════════════════════
    //  INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════

    /**
     * Procesa un GeoJSON de lotes y retorna un arreglo de propiedades.
     * @param {Object}  geojson       — FeatureCollection
     * @param {number}  idProyecto
     * @param {number}  idEtapa
     * @param {number}  precioDefault — precio por defecto si no viene en el GeoJSON
     * @param {number}  startId       — ID inicial para asignación secuencial
     * @returns {Array} propiedades generadas
     */
    function _procesarGeoJSON(geojson, idProyecto, idEtapa, precioDefault, startId) {
        if (!geojson || !geojson.features) return [];

        var propiedades = [];
        var propId = startId;

        for (var i = 0; i < geojson.features.length; i++) {
            var feat = geojson.features[i];
            var props = feat.properties || {};

            // — Nombre
            var nombre = props.Lote || props.nombre || ('Lote ' + (i + 1));

            // — Superficie (parsear variantes: Area, Hectareas, Superficie)
            var supRaw = props.Area || props.Hectareas || props.Superficie || 0;
            var superficie = APP5T_Utils.parsearSuperficie(supRaw);

            // — Precio (respetar null → default)
            var precioRaw = props.Precio;
            var valorFinal = precioRaw ? APP5T_Utils.sanitizeNumber(precioRaw) : 0;
            if (!valorFinal) valorFinal = precioDefault;

            // — Estado (RESPETAR valores existentes)
            var estado = APP5T_Utils.normalizarEstado(props.Estado);

            // — Coordenadas: geometría GeoJSON completa
            var coordenadas = feat.geometry || null;

            propiedades.push({
                id:               propId++,
                id_etapa:         idEtapa,
                id_proyecto:      idProyecto,
                nombre:           nombre,
                rol:              '',
                superficie:       superficie,
                coordenadas:      coordenadas,
                valor_final:      valorFinal,
                fecha_ingreso:    APP5T_Utils.fechaHoy(),
                deslindes:        '',
                infraestructura:  '',
                fecha_reserva:    '',
                fecha_fin_promesa:'',
                fecha_venta:      '',
                url:              '',
                estado:           estado
            });
        }

        return propiedades;
    }

    /**
     * Inicializa la base de datos.
     * Si la versión coincide, no hace nada (datos ya cargados).
     * Si no, reconstruye desde los GeoJSON globales.
     */
    function init() {
        // ¿La versión almacenada coincide?
        var storedVersion = localStorage.getItem(KEY_PREFIX + 'db_version');
        if (storedVersion === DB_VERSION) {
            return; // ya inicializado
        }

        // ── Limpiar todas las claves app5t_ ──
        var keysToRemove = [];
        for (var k = 0; k < localStorage.length; k++) {
            var key = localStorage.key(k);
            if (key && key.indexOf(KEY_PREFIX) === 0) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(function (key) {
            localStorage.removeItem(key);
        });

        // ── Establecer versión ──
        localStorage.setItem(KEY_PREFIX + 'db_version', DB_VERSION);

        // ── Inicializar tablas vacías ──
        TABLES.forEach(function (t) {
            _save(t, []);
        });

        // ── Proyectos ──
        var hoy = APP5T_Utils.fechaHoy();

        var proyectos = [
            {
                id: 1, nombre_proyecto: 'El Copihue', nombre: 'El Copihue', ubicacion: 'Sector Copihue',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.120, lng: -71.776 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: ''
            },
            {
                id: 2, nombre_proyecto: 'Las Brisas', nombre: 'Las Brisas', ubicacion: 'Sector Las Brisas',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.385, lng: -71.953 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: ''
            },
            {
                id: 3, nombre_proyecto: 'Los Encinos', nombre: 'Los Encinos', ubicacion: 'Sector Los Encinos',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.468, lng: -71.842 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: ''
            },
            {
                id: 4, nombre_proyecto: 'Los Naranjos', nombre: 'Los Naranjos', ubicacion: 'Sector Los Naranjos',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.478, lng: -71.838 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: ''
            }
        ];
        _save('proyectos', proyectos);

        // ── Etapas (1 por proyecto) ──
        var etapas = [
            { id: 1, id_proyecto: 1, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
            { id: 2, id_proyecto: 2, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
            { id: 3, id_proyecto: 3, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
            { id: 4, id_proyecto: 4, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' }
        ];
        _save('etapas', etapas);

        // ── Propiedades desde GeoJSON ──
        // Mapeo: variable global → id_proyecto, id_etapa, precio por defecto
        var geoSources = [
            { varName: 'json_copihue_lotes',  idProy: 1, idEtapa: 1, defaultPrice: 33000000 },
            { varName: 'json_brisas_lotes',   idProy: 2, idEtapa: 2, defaultPrice: 18000000 },
            { varName: 'json_encinos_lotes',  idProy: 3, idEtapa: 3, defaultPrice: 33000000 },
            { varName: 'json_naranjos_lotes', idProy: 4, idEtapa: 4, defaultPrice: 18000000 }
        ];

        var allProps = [];
        var nextId = 1;

        geoSources.forEach(function (src) {
            var geojson = window[src.varName] || null;
            var lotes = _procesarGeoJSON(geojson, src.idProy, src.idEtapa, src.defaultPrice, nextId);
            nextId += lotes.length;
            allProps = allProps.concat(lotes);
        });

        _save('propiedades', allProps);

        // ── Actualizar nro_lotes en cada etapa ──
        etapas.forEach(function (et) {
            var lotesCount = 0;
            for (var j = 0; j < allProps.length; j++) {
                if (allProps[j].id_etapa === et.id) lotesCount++;
            }
            et.nro_lotes = lotesCount;
        });
        _save('etapas', etapas);

        // ── Tablas pre-pobladas ──
        var vendedores = [
            {
                id: 1, rut: '11.111.111-1', nombre: 'Ricardo Comercial', fecha_ingreso: hoy,
                ciudad: 'Santiago', telefono: '+56 9 1111 1111', email: 'ricardo@5tierras.cl',
                cargo: 'Ejecutivo Senior', estado: 'Activo'
            }
        ];
        _save('vendedores', vendedores);

        var directorio = [
            {
                id: 1, rut: '22.222.222-2', nombre: 'Ximena Guzmán', cargo: 'Directora Ejecutiva',
                telefono: '+56 9 2222 2222', email: 'ximena@5tierras.cl', fecha_ingreso: hoy,
                estado: 'Disponible', auth_reserva: 'S', firma_reserva: 'S',
                auth_promesa: 'S', firma_promesa: 'S', auth_venta: 'S', firma_venta: 'S'
            }
        ];
        _save('directorio', directorio);

        var clientes = [
            {
                id: 1, rut: '33.333.333-3', nombres: 'Juan', apellidos: 'Pérez', fecha_nacimiento: '1980-01-01',
                direccion: 'Av. Vitacura 1234', comuna: 'Vitacura', telefono: '+56 9 3333 3333',
                email: 'juan.perez@gmail.com', estado_civil: 'Soltero', regimen_matrimonial: 'Separación de Bienes',
                canal_captacion: 'Directo', id_vendedor: 1, motivo_busqueda: 'Vivienda',
                notas: 'Interesado en proyecto El Copihue', fecha_ingreso: hoy, estado_cliente: 'Activo'
            }
        ];
        _save('clientes', clientes);

        console.log('[APP5T_DB] Base de datos inicializada — ' + allProps.length + ' propiedades cargadas.');
    }

    // ═══════════════════════════════════════════════════════
    //  WORKFLOWS DE NEGOCIACIÓN
    // ═══════════════════════════════════════════════════════

    // ───────────────────── SOLICITAR RESERVA ─────────────────────

    /**
     * Inicia una solicitud de reserva sobre una propiedad disponible.
     * @param {number} idPropiedad
     * @param {number} idVendedor
     * @param {number} idCliente
     * @param {Object} data — valor_final, pie, cantidad_cuotas, etc.
     * @returns {{success:boolean, id_negociacion:number, error:string}}
     */
    function solicitarReserva(idPropiedad, idVendedor, idCliente, data) {
        data = data || {};

        var prop = getById('propiedades', idPropiedad);
        if (!prop) return { success: false, error: 'Propiedad no encontrada' };
        if (prop.estado !== 'Disponible') return { success: false, error: 'Propiedad no disponible' };

        var neg = {
            id_propiedad:           idPropiedad,
            id_vendedor:            idVendedor,
            id_cliente:             idCliente,
            fecha_negociacion:      APP5T_Utils.fechaHoy(),
            valor_final:            data.valor_final || prop.valor_final,
            pie:                    data.pie || 0,
            cantidad_cuotas:        data.cantidad_cuotas || 0,
            fecha_vencimiento_cuota:data.fecha_vencimiento_cuota || '',
            tipo_moneda:            data.tipo_moneda || 'CLP',
            url:                    data.url || '',
            estado_avance:          'En Curso',
            reajuste:               data.reajuste || '',
            id_proceso:             'Reserva'
        };

        var res = insert('negociaciones', neg);

        // Marcar la propiedad como Pendiente
        update('propiedades', idPropiedad, { estado: 'Pendiente' });

        // Auditoría
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Solicitud Reserva', res.id,
                 'Propiedad: ' + prop.nombre);

        return { success: true, id_negociacion: res.id };
    }

    // ───────────────────── APROBAR RESERVA ─────────────────────

    /**
     * Un director autorizado aprueba la reserva.
     * @param {number} idNegociacion
     * @param {number} idDirector
     * @returns {{success:boolean, error:string}}
     */
    function aprobarReserva(idNegociacion, idDirector) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        if (neg.id_proceso !== 'Reserva' || neg.estado_avance !== 'En Curso') {
            return { success: false, error: 'Negociación no está en proceso de Reserva' };
        }

        var dir = getById('directorio', idDirector);
        if (!dir || dir.auth_reserva !== 'S') {
            return { success: false, error: 'Director no autorizado para aprobar reservas' };
        }

        // Actualizar propiedad
        update('propiedades', neg.id_propiedad, {
            estado: 'Reservada',
            fecha_reserva: APP5T_Utils.fechaHoy()
        });

        // Actualizar negociación
        update('negociaciones', idNegociacion, { estado_avance: 'Aprobado' });

        // Auditoría
        logAudit(dir.nombre, 'Director', 'negociaciones', 'Aprobación Reserva',
                 idNegociacion, 'Propiedad ID: ' + neg.id_propiedad);

        return { success: true };
    }

    // ───────────────────── RECHAZAR RESERVA ─────────────────────

    /**
     * Rechaza una solicitud de reserva.
     * @param {number} idNegociacion
     * @param {string} [motivo]
     * @returns {{success:boolean, error:string}}
     */
    function rechazarReserva(idNegociacion, motivo) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        // Devolver propiedad a Disponible
        update('propiedades', neg.id_propiedad, { estado: 'Disponible' });

        // Marcar negociación como rechazada
        update('negociaciones', idNegociacion, { estado_avance: 'Rechazado' });

        // Auditoría
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Rechazo Reserva',
                 idNegociacion, motivo || 'Sin motivo');

        return { success: true };
    }

    // ───────────────────── FIRMAR PROMESA ─────────────────────

    /**
     * Firma de promesa de compraventa. Genera cuotas automáticamente.
     * @param {number} idNegociacion
     * @param {Object} data — puede incluir valor_final, pie, cantidad_cuotas,
     *                         fecha_vencimiento_cuota, fecha_fin_promesa, url
     * @returns {{success:boolean, error:string}}
     */
    function firmarPromesa(idNegociacion, data) {
        data = data || {};

        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        var prop = getById('propiedades', neg.id_propiedad);

        // ── Actualizar negociación con datos nuevos ──
        var negUpdate = {
            id_proceso: 'Promesa',
            estado_avance: 'En Curso'
        };
        if (data.valor_final !== undefined)            negUpdate.valor_final = data.valor_final;
        if (data.pie !== undefined)                    negUpdate.pie = data.pie;
        if (data.cantidad_cuotas !== undefined)         negUpdate.cantidad_cuotas = data.cantidad_cuotas;
        if (data.fecha_vencimiento_cuota !== undefined) negUpdate.fecha_vencimiento_cuota = data.fecha_vencimiento_cuota;
        if (data.url !== undefined)                    negUpdate.url = data.url;

        update('negociaciones', idNegociacion, negUpdate);

        // ── Actualizar propiedad ──
        update('propiedades', neg.id_propiedad, {
            estado: 'Promesada',
            fecha_fin_promesa: data.fecha_fin_promesa || ''
        });

        // ── Generar cuenta corriente (cuotas) ──
        var updatedNeg = getById('negociaciones', idNegociacion);
        var montoRestante = (updatedNeg.valor_final || 0) - (updatedNeg.pie || 0);
        var cantCuotas = updatedNeg.cantidad_cuotas || 0;

        if (cantCuotas > 0 && montoRestante > 0) {
            var valorCuota = Math.round(montoRestante / cantCuotas);
            var fechaBase = APP5T_Utils.parseFecha(updatedNeg.fecha_vencimiento_cuota) || new Date();

            for (var i = 0; i < cantCuotas; i++) {
                var fechaVenc = new Date(fechaBase.getTime());
                fechaVenc.setMonth(fechaVenc.getMonth() + i);

                insert('cuenta_corriente', {
                    id_cliente:        updatedNeg.id_cliente,
                    id_propiedad:      updatedNeg.id_propiedad,
                    cuota_nro:         i + 1,
                    valor_cuota:       valorCuota,
                    fecha_vencimiento: APP5T_Utils.formatFecha(fechaVenc),
                    valor_pagado:      0,
                    fecha_pago:        '',
                    url:               '',
                    estado_cuota:      'Pendiente Pago'
                });
            }
        }

        // Auditoría
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Firma Promesa',
                 idNegociacion, 'Propiedad: ' + (prop ? prop.nombre : neg.id_propiedad));

        return { success: true };
    }

    // ───────────────────── FIRMAR ESCRITURA ─────────────────────

    /**
     * Cierra la venta: firma de escritura definitiva.
     * @param {number} idNegociacion
     * @param {Object} [data]
     * @returns {{success:boolean, error:string}}
     */
    function firmarEscritura(idNegociacion, data) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        // Propiedad → Vendida
        update('propiedades', neg.id_propiedad, {
            estado: 'Vendida',
            fecha_venta: APP5T_Utils.fechaHoy()
        });

        // Negociación → Venta / Finalizado
        update('negociaciones', idNegociacion, {
            id_proceso: 'Venta',
            estado_avance: 'Finalizado'
        });

        // Auditoría
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Firma Escritura',
                 idNegociacion, 'Venta finalizada');

        return { success: true };
    }

    // ───────────────────── REGISTRAR PAGO ─────────────────────

    /**
     * Registra un pago parcial o total sobre una cuota.
     * @param {number} idCtaCte
     * @param {*}      valorPagado    — monto (cualquier formato)
     * @param {string} fechaPago      — dd/mm/aaaa
     * @param {string} [urlComprobante]
     * @returns {{success:boolean, error:string}}
     */
    function registrarPago(idCtaCte, valorPagado, fechaPago, urlComprobante) {
        var cuota = getById('cuenta_corriente', idCtaCte);
        if (!cuota) return { success: false, error: 'Cuota no encontrada' };

        valorPagado = APP5T_Utils.sanitizeNumber(valorPagado);

        var estadoCuota = 'Pendiente Pago';
        if (valorPagado >= cuota.valor_cuota) {
            estadoCuota = 'Pagada';
        } else if (valorPagado > 0) {
            estadoCuota = 'Abonada';
        }

        update('cuenta_corriente', idCtaCte, {
            valor_pagado: valorPagado,
            fecha_pago:   fechaPago,
            url:          urlComprobante || '',
            estado_cuota: estadoCuota
        });

        logAudit('Sistema', 'Sistema', 'cuenta_corriente', 'Registro Pago',
                 idCtaCte, 'Monto: ' + valorPagado);

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════
    //  ESTADÍSTICAS
    // ═══════════════════════════════════════════════════════

    /**
     * Retorna un objeto completo de estadísticas del sistema.
     * @returns {Object}
     */
    function getStats() {
        var props  = _load('propiedades');
        var cuotas = _load('cuenta_corriente');
        var proyectos = _load('proyectos');

        var stats = {
            totales:             props.length,
            disponibles:         0,
            pendientes:          0,
            reservadas:          0,
            promesadas:          0,
            vendidas:            0,
            ingresoRecaudado:    0,
            ingresoComprometido: 0,
            ingresoProyectado:   0,
            ingresoTotal:        0,
            perProject:          {},
            cuotasPendientes:    0,
            cuotasPagadas:       0,
            cuotasAbonadas:      0,
            montoRecaudadoCuotas:0,
            montoPendienteCuotas:0
        };

        // ── Conteo por estado de propiedades ──
        for (var i = 0; i < props.length; i++) {
            var p = props[i];
            var val = p.valor_final || 0;

            switch (p.estado) {
                case 'Disponible':
                    stats.disponibles++;
                    break;
                case 'Pendiente':
                    stats.pendientes++;
                    stats.ingresoProyectado += val;
                    break;
                case 'Reservada':
                    stats.reservadas++;
                    stats.ingresoProyectado += val;
                    break;
                case 'Promesada':
                    stats.promesadas++;
                    stats.ingresoComprometido += val;
                    break;
                case 'Vendida':
                    stats.vendidas++;
                    stats.ingresoRecaudado += val;
                    break;
            }
        }

        stats.ingresoTotal = stats.ingresoRecaudado
                           + stats.ingresoComprometido
                           + stats.ingresoProyectado;

        // ── Desglose por proyecto ──
        for (var pi = 0; pi < proyectos.length; pi++) {
            var proy = proyectos[pi];
            var projStats = {
                disponibles: 0, pendientes: 0, reservadas: 0,
                promesadas: 0, vendidas: 0, total: 0, monto: 0
            };

            for (var j = 0; j < props.length; j++) {
                if (props[j].id_proyecto === proy.id) {
                    projStats.total++;
                    projStats.monto += (props[j].valor_final || 0);

                    switch (props[j].estado) {
                        case 'Disponible': projStats.disponibles++; break;
                        case 'Pendiente':  projStats.pendientes++;  break;
                        case 'Reservada':  projStats.reservadas++;  break;
                        case 'Promesada':  projStats.promesadas++;  break;
                        case 'Vendida':    projStats.vendidas++;    break;
                    }
                }
            }

            stats.perProject[proy.nombre] = projStats;
        }

        // ── Cuotas ──
        for (var ci = 0; ci < cuotas.length; ci++) {
            var c = cuotas[ci];
            switch (c.estado_cuota) {
                case 'Pendiente Pago':
                    stats.cuotasPendientes++;
                    stats.montoPendienteCuotas += (c.valor_cuota || 0);
                    break;
                case 'Pagada':
                    stats.cuotasPagadas++;
                    stats.montoRecaudadoCuotas += (c.valor_pagado || 0);
                    break;
                case 'Abonada':
                    stats.cuotasAbonadas++;
                    stats.montoRecaudadoCuotas += (c.valor_pagado || 0);
                    stats.montoPendienteCuotas += ((c.valor_cuota || 0) - (c.valor_pagado || 0));
                    break;
            }
        }

        return stats;
    }

    // ═══════════════════════════════════════════════════════
    //  AUDITORÍA
    // ═══════════════════════════════════════════════════════

    /**
     * Registra una entrada de auditoría (se inserta al inicio, cap 1000).
     * @param {string} usuario
     * @param {string} rol
     * @param {string} tabla
     * @param {string} accion
     * @param {number} registroId
     * @param {string} detalle
     */
    function logAudit(usuario, rol, tabla, accion, registroId, detalle) {
        var audits = _load('auditoria');

        audits.unshift({
            id:          APP5T_Utils.generarId(audits),
            fecha:       new Date().toISOString(),
            usuario:     usuario || 'Sistema',
            rol:         rol || 'Sistema',
            tabla:       tabla,
            accion:      accion,
            registro_id: registroId,
            detalle:     detalle || ''
        });

        // Limitar a 1000 registros
        if (audits.length > 1000) {
            audits = audits.slice(0, 1000);
        }

        _save('auditoria', audits);
    }

    /**
     * Retorna el log de auditoría completo.
     * @returns {Array}
     */
    function getAuditoria() {
        return _load('auditoria');
    }

    // ═══════════════════════════════════════════════════════
    //  API PÚBLICA
    // ═══════════════════════════════════════════════════════

    return {
        // Inicialización
        init:               init,

        // CRUD genérico
        getAll:             getAll,
        getById:            getById,
        insert:             insert,
        update:             update,
        remove:             remove,
        query:              query,
        count:              count,

        // Workflows
        solicitarReserva:   solicitarReserva,
        aprobarReserva:     aprobarReserva,
        rechazarReserva:    rechazarReserva,
        firmarPromesa:      firmarPromesa,
        firmarEscritura:    firmarEscritura,
        registrarPago:      registrarPago,

        // Estadísticas
        getStats:           getStats,

        // Auditoría
        logAudit:           logAudit,
        getAuditoria:       getAuditoria
    };

})();
