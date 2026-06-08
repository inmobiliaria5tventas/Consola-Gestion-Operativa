/* ==========================================================================
   APP5T_Map  –  Módulo de mapa interactivo (Leaflet)
   5 Tierras CRM & GIS
   ========================================================================== */

const APP5T_Map = (function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────────
    let map            = null;
    let currentLayer   = null;
    let currentProject = null;
    let selectedFeature = null;
    let labelsGroup    = null;
    let onLoteSelect   = null;
    let projectMarkersGroup = null;

    // ── Project centres ────────────────────────────────────────────────────
    const CENTERS = {
        'El Copihue':   { lat: -36.120, lng: -71.776, zoom: 15 },
        'Las Brisas':   { lat: -36.385, lng: -71.953, zoom: 16 },
        'Los Encinos':  { lat: -36.468, lng: -71.842, zoom: 16 },
        'Los Naranjos': { lat: -36.478, lng: -71.838, zoom: 15 }
    };

    // ── Estado → colour ────────────────────────────────────────────────────
    const COLORS = {
        'Disponible': '#2ecc71',
        'Pendiente':  '#f1c40f',
        'Reservada':  '#f39c12',
        'Promesada':  '#3498db',
        'Vendida':    '#e74c3c'
    };

    // ── Default (unselected) feature style ─────────────────────────────────
    function _defaultStyle(estado) {
        return {
            fillColor:   COLORS[estado] || '#95a5a6',
            fillOpacity: 0.5,
            weight:      1.5,
            color:       'rgba(255,255,255,0.6)',
            opacity:     1
        };
    }

    // ── Highlight style ────────────────────────────────────────────────────
    function _highlightStyle(estado) {
        return {
            fillColor:   COLORS[estado] || '#95a5a6',
            fillOpacity: 0.7,
            weight:      3,
            color:       '#ffffff',
            opacity:     1
        };
    }

    // ── Deselect the previously selected feature ───────────────────────────
    function _deselectPrevious() {
        if (selectedFeature && selectedFeature.layer) {
            const estado = selectedFeature.data ? selectedFeature.data.estado : 'Disponible';
            selectedFeature.layer.setStyle(_defaultStyle(estado));
        }
        selectedFeature = null;
    }

    // ── Toggle label visibility based on zoom ──────────────────────────────
    function _updateLabelVisibility() {
        if (!map || !labelsGroup) return;
        const zoom = map.getZoom();
        console.log('APP5T_Map: _updateLabelVisibility called. Current Zoom:', zoom);

        // Use CSS class on the map container to toggle labels
        const mapContainer = map.getContainer();
        if (zoom >= 15) {
            mapContainer.classList.add('show-lot-labels');
            // Hide project logo markers when zoomed in
            if (projectMarkersGroup && map.hasLayer(projectMarkersGroup)) {
                map.removeLayer(projectMarkersGroup);
                console.log('APP5T_Map: Zoom >= 15, hiding project logo markers.');
            }
        } else {
            mapContainer.classList.remove('show-lot-labels');
            // Show project logo markers when zoomed out
            if (projectMarkersGroup && !map.hasLayer(projectMarkersGroup)) {
                projectMarkersGroup.addTo(map);
                console.log('APP5T_Map: Zoom < 15, showing project logo markers.');
            }
        }
    }

    // ── Add project logo markers ───────────────────────────────────────────
    function _addProjectLogoMarkers() {
        console.log('APP5T_Map: Initializing project logo markers...');
        if (!map) {
            console.error('APP5T_Map: Map instance is null!');
            return;
        }
        if (!projectMarkersGroup) {
            projectMarkersGroup = L.layerGroup().addTo(map);
            console.log('APP5T_Map: Created projectMarkersGroup layer group and added to map.');
        } else {
            projectMarkersGroup.clearLayers();
            console.log('APP5T_Map: Cleared existing logo markers.');
        }

        const logoUrls = {
            'El Copihue':   '../04_RECURSOS/Logos/El%20Copihue.png',
            'Las Brisas':   '../04_RECURSOS/Logos/Las%20Brisas.png',
            'Los Encinos':  '../04_RECURSOS/Logos/Los%20Encinos.png',
            'Los Naranjos': '../04_RECURSOS/Logos/Los%20Naranjos.png'
        };

        const offsets = {
            'Los Encinos':  { lat: 0.007, lng: -0.007 },
            'Los Naranjos': { lat: -0.007, lng: 0.007 }
        };

        Object.keys(CENTERS).forEach(function (name) {
            const centre = CENTERS[name];
            const logoUrl = logoUrls[name];
            const offset = offsets[name] || { lat: 0, lng: 0 };
            const markerLat = centre.lat + offset.lat;
            const markerLng = centre.lng + offset.lng;

            console.log('APP5T_Map: Adding logo marker for', name, 'at lat:', markerLat, 'lng:', markerLng, 'using src:', logoUrl);

            // Create custom Leaflet divIcon with child img tag wrapped in project-logo-inner
            const projectIcon = L.divIcon({
                html: '<div class="project-logo-inner"><img src="' + logoUrl + '" style="width:100% !important; height:100% !important; object-fit:contain; display:block; max-width:none !important;" onerror="console.error(\'Logo failed to load:\', this.src)" /></div>',
                iconSize: [42, 42],
                iconAnchor: [21, 21],
                className: 'project-map-logo-container'
            });

            // Create marker at offset coordinates (keeps flyTo centered on exact location)
            const marker = L.marker([markerLat, markerLng], { icon: projectIcon });
            
            // Tooltip on hover
            marker.bindTooltip(name, {
                direction: 'top',
                offset: [0, -18],
                className: 'project-logo-tooltip'
            });

            // Click -> zoom/fly to project & sync filters select dropdown
            marker.on('click', function () {
                zoomToProject(name);
                const projSel = document.getElementById('map-project-select');
                if (projSel) {
                    projSel.value = name;
                    projSel.dispatchEvent(new Event('change'));
                }
            });

            projectMarkersGroup.addLayer(marker);
        });
        console.log('APP5T_Map: Added all project logo markers to group. Layer count:', projectMarkersGroup.getLayers().length);
    }

    // ── Resolve project name → project id ──────────────────────────────────
    function _getProjectId(projectName) {
        const proyectos = APP5T_DB.getAll('proyectos');
        const match = proyectos.find(p => p.nombre === projectName);
        return match ? match.id : null;
    }

    // ── Public: init ───────────────────────────────────────────────────────
    function init(containerId, onSelectCallback) {
        onLoteSelect = onSelectCallback || null;

        // Create map
        map = L.map(containerId, {
            zoomControl: false,
            attributionControl: true
        });

        // Tile layer – Esri World Imagery
        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: '&copy; Esri &mdash; Sources: Esri, DigitalGlobe, Earthstar, CNES/Airbus DS, GeoEye, USDA FSA, USGS, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community',
                maxZoom: 19
            }
        ).addTo(map);

        // Zoom control bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Labels layer group
        labelsGroup = L.layerGroup().addTo(map);

        // Default view – El Copihue
        const def = CENTERS['El Copihue'];
        map.setView([def.lat, def.lng], def.zoom);

        // Zoom change → toggle label visibility
        map.on('zoomend', _updateLabelVisibility);
        _updateLabelVisibility();
    }

    // ── Public: loadAllProjects ────────────────────────────────────────────
    function loadAllProjects() {
        if (!map) return;

        if (currentLayer) {
            map.removeLayer(currentLayer);
            currentLayer = null;
        }
        labelsGroup.clearLayers();
        _deselectPrevious();

        // Add logo markers
        _addProjectLogoMarkers();

        const propiedades = APP5T_DB.getAll('propiedades') || [];

        if (propiedades.length === 0) {
            return;
        }

        // Build GeoJSON FeatureCollection
        const features = [];
        propiedades.forEach(function (prop) {
            if (!prop.coordenadas) return;
            features.push({
                type: 'Feature',
                geometry: prop.coordenadas,
                properties: {
                    id:          prop.id,
                    nombre:      prop.nombre,
                    estado:      prop.estado,
                    superficie:  prop.superficie,
                    valor_final: prop.valor_final,
                    id_etapa:    prop.id_etapa,
                    _raw:        prop          // keep full record for callbacks
                }
            });
        });

        const fc = { type: 'FeatureCollection', features: features };

        // Create GeoJSON layer
        currentLayer = L.geoJSON(fc, {
            style: function (feature) {
                return _defaultStyle(feature.properties.estado);
            },
            onEachFeature: function (feature, layer) {
                // Store propiedad id on layer for later lookup
                layer._propiedadId = feature.properties.id;

                // Click handler
                layer.on('click', function () {
                    _deselectPrevious();

                    layer.setStyle(_highlightStyle(feature.properties.estado));
                    layer.bringToFront();

                    selectedFeature = {
                        layer: layer,
                        data:  feature.properties._raw
                    };

                    if (typeof onLoteSelect === 'function') {
                        onLoteSelect(feature.properties._raw);
                    }
                });

                // Permanent tooltip for lot name (CSS-controlled visibility)
                var labelText = (feature.properties.nombre || '').replace(/^Lote\s*/i, '');
                layer.bindTooltip(labelText, {
                    permanent:  true,
                    direction:  'center',
                    className:  'lot-label'
                });
            }
        }).addTo(map);

        // Fit bounds to show everything
        try {
            map.fitBounds(currentLayer.getBounds(), { padding: [30, 30] });
        } catch (e) {
            // Fallback
            const def = CENTERS['El Copihue'];
            if (def) map.setView([def.lat, def.lng], 13);
        }

        _updateLabelVisibility();
    }

    // ── Public: zoomToProject ──────────────────────────────────────────────
    function zoomToProject(projectName) {
        if (!map) return;
        if (projectName === 'todos' || projectName === 'all' || !projectName) {
             if (currentLayer) {
                  try { map.fitBounds(currentLayer.getBounds(), { padding: [30, 30] }); } catch(e){}
             }
             return;
        }
        const centre = CENTERS[projectName];
        if (centre) {
             map.flyTo([centre.lat, centre.lng], centre.zoom, { duration: 1 });
        }
    }

    // ── Public: refreshColors ──────────────────────────────────────────────
    function refreshColors() {
        if (!currentLayer) return;

        currentLayer.eachLayer(function (layer) {
            const id = layer._propiedadId;
            if (id == null) return;

            const prop = APP5T_DB.getById('propiedades', id);
            if (!prop) return;

            // Keep selected state untouched
            if (selectedFeature && selectedFeature.layer === layer) {
                layer.setStyle(_highlightStyle(prop.estado));
            } else {
                layer.setStyle(_defaultStyle(prop.estado));
            }

            // Update stored feature properties
            if (layer.feature && layer.feature.properties) {
                layer.feature.properties.estado = prop.estado;
                layer.feature.properties._raw   = prop;
            }
        });
    }

    // ── Public: highlightLote ──────────────────────────────────────────────
    function highlightLote(propiedadId) {
        if (!currentLayer) return;

        _deselectPrevious();

        currentLayer.eachLayer(function (layer) {
            if (layer._propiedadId === propiedadId) {
                const estado = layer.feature ? layer.feature.properties.estado : 'Disponible';
                layer.setStyle(_highlightStyle(estado));
                layer.bringToFront();

                selectedFeature = {
                    layer: layer,
                    data:  layer.feature ? layer.feature.properties._raw : null
                };

                // Pan to feature
                if (layer.getBounds) {
                    map.panTo(layer.getBounds().getCenter());
                } else if (layer.getLatLng) {
                    map.panTo(layer.getLatLng());
                }
            }
        });
    }

    // ── Public: getStatusFilter ────────────────────────────────────────────
    function getStatusFilter() {
        const el = document.getElementById('map-status-filter');
        if (!el) return 'todos';
        return el.value || 'todos';
    }

    // ── Public: applyFilter ────────────────────────────────────────────────
    function applyFilter(statusFilter) {
        if (!currentLayer) return;

        const filterValue = statusFilter || getStatusFilter();

        currentLayer.eachLayer(function (layer) {
            if (!layer.feature) return;

            const estado = layer.feature.properties.estado;
            const visible = (filterValue === 'todos' || estado === filterValue);

            const el = layer.getElement ? layer.getElement() : null;
            if (el) {
                el.style.display = visible ? '' : 'none';
            }

            // Also toggle the tooltip
            const tooltip = layer.getTooltip ? layer.getTooltip() : null;
            if (tooltip) {
                const tipEl = tooltip.getElement ? tooltip.getElement() : null;
                if (tipEl) {
                    tipEl.style.display = visible ? '' : 'none';
                }
            }
        });
    }

    // ── Public: destroy ────────────────────────────────────────────────────
    function destroy() {
        if (map) {
            map.off();
            map.remove();
            map = null;
        }
        currentLayer    = null;
        currentProject  = null;
        selectedFeature = null;
        labelsGroup     = null;
        onLoteSelect    = null;
        projectMarkersGroup = null;
    }

    // ── Public API ─────────────────────────────────────────────────────────
    var _api = {
        init:          init,
        loadAllProjects: loadAllProjects,
        zoomToProject: zoomToProject,
        refreshColors: refreshColors,
        highlightLote: highlightLote,
        getStatusFilter: getStatusFilter,
        applyFilter:   applyFilter,
        destroy:       destroy,
        COLORS:        COLORS,
        CENTERS:       CENTERS,
        _initialized:  false
    };

    // Expose map instance via getter for invalidateSize
    Object.defineProperty(_api, '_mapInstance', {
        get: function () { return map; }
    });

    return _api;

})();
