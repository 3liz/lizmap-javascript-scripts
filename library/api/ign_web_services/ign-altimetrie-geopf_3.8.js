/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

const lizmapIgnAltimetrie = function() {

    // ID of the dock (do not change)
    const DOCK_ID = 'ign_altimetrie';
    // Icon of the dock menu and used before each link
    // See https://getbootstrap.com/2.3.2/base-css.html#icons
    const DOCK_ICON = 'icon-screenshot';
    // Dock position: can be dock, minidock, right-dock
    const DOCK_POSITION = 'minidock';
    // Title of the dock
    const DOCK_TITLE = 'Altimétrie';
    // Description displayed at the top of the dock content
    const DOCK_DESCRIPTION = 'Altitude du point';
    // Description displayed when waiting for result
    const DOCK_WAIT = 'En attente du résultat d\'altitude du point';
    // Sentence used when no click has been made on the map yet
    const DOCK_PLEASE_CLICK = 'Veuillez cliquer sur la carte <br />pour connaitre l\'altitude.';

    // IGN API Configuration
    const IGN_SERVICE_KEY = '';
    const IGN_SERVICE_URL = 'https://data.geopf.fr/';
    const IGN_ENTRY_POINTS = '/altimetrie/1.0/calcul/alti/rest/elevation.json?resource=ign_rge_alti_wld';
    const FETCH_TIMEOUT_MS = 5000;
    
    // Map State
    let _map = null;
    let _drawLayer = null;
    let _currentFetchController = null;

    // Styles tels que définis par OpenLayers
    // https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html
    const _drawStyle = {
        'circle-radius': 8,
        'circle-stroke-color': 'lightgreen',
        'circle-stroke-width': 3,
        'circle-fill-color': 'rgba(0,128,0,0.6)' //green
    };

    lizMap.events.on({
        'uicreated': function(e) {

            lizMap.addDock(
                DOCK_ID,
                DOCK_TITLE,
                DOCK_POSITION,
                DOCK_PLEASE_CLICK,
                DOCK_ICON);
            initIgnAltiView();
        }
    });

    /**
     * Check if dock is currently active
     * @returns {boolean} True if dock is active
     */
    function isDockActive() {
        const dock = document.getElementById(DOCK_ID);
        return dock && dock.classList.contains('active');
    }

    /**
     * Get the dock content element
     * @returns {HTMLElement|null} The dock content element
     */
    function getDockContent() {
        const dock = document.getElementById(DOCK_ID);
        return dock ? dock.querySelector('.menu-content') : null;
    }

    /**
     * Update dock content with safe null checks
     * @param {string} html - HTML content to display
     */
    function updateDockContent(html) {
        const content = getDockContent();
        if (content) {
            content.innerHTML = html;
        }
    }

    /**
     * Validate altitude service response
     * @param {Object} data - Response data
     * @returns {boolean} True if valid
     */
    function validateAltitudeResponse(data) {
        return data && 
            Array.isArray(data.elevations) && 
            data.elevations.length > 0 && 
            typeof data.elevations[0].z === 'number';
    }

    /**
     * Fetch altitude data from IGN service using Fetch API
     * @param {number} lon - Longitude
     * @param {number} lat - Latitude
     * @param {Function} successCallback - Callback on success
     * @param {Function} errorCallback - Callback on error
     */
    function fetchIgnAltitude(lon, lat, successCallback, errorCallback) {
        // Cancel previous request if still pending
        if (_currentFetchController) {
            _currentFetchController.abort();
        }

        const fullUrl = IGN_SERVICE_URL + IGN_SERVICE_KEY + IGN_ENTRY_POINTS;
        const params = new URLSearchParams({
            'lon': lon,
            'lat': lat,
            'srs': lizMap.map.projection.projCode
        });

        _currentFetchController = new AbortController();
        const timeoutId = setTimeout(() => _currentFetchController.abort(), FETCH_TIMEOUT_MS);

        fetch(`${fullUrl}&${params.toString()}`, {
            method: 'GET',
            signal: _currentFetchController.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (validateAltitudeResponse(data)) {
                successCallback(data);
            } else {
                errorCallback('Réponse invalide du service IGN');
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            if (error.name !== 'AbortError') {                 
                console.error('Erreur lors de la récupération de l\'altitude:', error.message);
                errorCallback(`Erreur: ${error.message}`);
            }
        })
        .finally(() => {
            _currentFetchController = null;
        });
    }

    /**
     * Request altitude for coordinates and update dock
     * @param {number} lon - Longitude coordinate
     * @param {number} lat - Latitude coordinate
     */
    function getIgnAlti(lon, lat){
        if (!isDockActive()) {
            return;
        }

        updateDockContent(`<p style="padding: 5px; font-style: italic; font-size: 0.8em; background: lightgray;">${DOCK_WAIT}</p>`);      

        fetchIgnAltitude(
            lon,
            lat,
            function(data) {                
                const html = `
                    <p style="padding: 5px;">${DOCK_DESCRIPTION}</p>
                    <p style="padding: 5px;">
                        <b>Longitude</b> : ${lon}<br>
                        <b>Latitude</b> : ${lat}<br>
                        <b>Altitude</b> : ${data.elevations[0].z}
                    </p>
                `;            
                updateDockContent(html);   
            },
            function(error) {
                updateDockContent(`<p style="padding: 5px; color: red; font-style: italic;">${error}</p>`);
         }
        );
    }

    // ========================
    // Event Handlers
    // ========================
    /**
     * Handle map click event
     * @param {Object} event - OpenLayers click event
     */
    function onMapClick(event) {
        // update panel only if active
        if (!isDockActive()) {
            return;
        }
    
        _drawLayer.getSource().clear();
        let point  = new lizMap.ol.geom.Point(event.coordinate);
        
        _drawLayer.getSource().addFeature(
            new lizMap.ol.Feature({
                geometry: point.clone()
            })
        )
        // Reproject to EPSG:4326 if needed
        if(lizMap.map.projection.projCode !== "EPSG:4326"){
            point.transform(lizMap.map.projection.projCode, 'EPSG:4326');
        }

        const [longitude, latitude] = point.getCoordinates();
        getIgnAlti(longitude.toFixed(6), latitude.toFixed(6));        
    }

    /**
     * Handle dock open - disable popup to prevent conflicts
     * @param {string} dockId - The dock ID
     */
    function onDockClosed(dockId){        
        if (dockId === DOCK_ID) {
            // Cancel pending fetch if still running
            if (_currentFetchController) {
                _currentFetchController.abort();
            }
            lizMap.mainLizmap.popup.active = true;
            updateDockContent(`<p style="padding: 5px; font-style: italic; font-size: 0.8em; background: lightgray;">${DOCK_PLEASE_CLICK}</p>`);
            _drawLayer.getSource().clear();
        }
    }

    function onDockOpened(dockId){
        if (dockId === DOCK_ID) {
            lizMap.mainLizmap.popup.active = false;
        }        
    }

    // ========================
    // Initialization
    // ========================
    /**
     * Initialize the altitude view
     */
    function initIgnAltiView() {
        // Validate lizMap availability
        if (!lizMap || !lizMap.mainLizmap || !lizMap.mainLizmap.map) {
            console.error('lizmapIgnAltimetrie: lizMap or map not available');
            return;
        }

        _map = lizMap.mainLizmap.map;

        _drawLayer = new lizMap.ol.layer.Vector({
            source: new lizMap.ol.source.Vector({
                wrapX: false
            }),
            style: _drawStyle
        });
        _map.addToolLayer(_drawLayer);

        // Register a click on OpenLayers > 2 map
        _map.on('singleclick', onMapClick);

        const dockEventTypes = ['dockopened', 'minidockopened', 'rightdockopened'];
        const closedEventTypes = ['dockclosed', 'minidockclosed', 'rightdockclosed'];

        const eventHandlers = {};
        
        dockEventTypes.forEach(type => {
            eventHandlers[type] = (e) => onDockOpened(e.id);
        });
        
        closedEventTypes.forEach(type => {
            eventHandlers[type] = (e) => onDockClosed(e.id);
        });

        lizMap.events.on(eventHandlers);
    }

    return {
        'id': DOCK_ID,
        'title': DOCK_TITLE,
        'serviceUrl': IGN_SERVICE_URL,
        'entryPoints': IGN_ENTRY_POINTS
    };
}();
