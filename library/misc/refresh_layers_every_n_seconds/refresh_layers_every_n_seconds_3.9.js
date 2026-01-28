/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

var lizRefreshLayers = function () {

    // =================
    //  CONFIGURATION
    // =================

    // List of layer QGIS names to refresh
    // Write the exact names as in QGIS project
    const QGIS_LAYER_NAMES = [
        'Quartiers',
        'SousQuartiers',
    ];

    // Refresh interval in milliseconds
    const REFRESH_INTERVAL_MS = 30000;

    // =================
    // END CONFIGURATION
    // Do not edit below
    // =================

    // Array of OpenLayers layers to refresh
    // Filled during initialization
    const OL_LAYERS = [];

    /**
     * Refresh visible layers
     *
     * @param {Array} olLayers - Array of OpenLayers layers to refresh
     */
    function refreshLayers(olLayers = []) {
        // console.log('lizRefreshLayers - Refreshing layers');
        // console.log(olLayers);
        for (var l in olLayers) {
            const layer = olLayers[l];
            if (layer.getVisible()) {
                layer.getSource().refresh();
            }
        }
    }

    /**
     * Initialize the refresh process
     * @returns {boolean}
     */
    function init() {
        // Find OpenLayers layers from QGIS layer names
        var olLayers = [];
        for (var i in QGIS_LAYER_NAMES) {
            const layerName = QGIS_LAYER_NAMES[i];
            const olLayer = lizMap.mainLizmap.map.getLayerByName(layerName)
            if (olLayer) {
                olLayers.push(olLayer);
            }
        }
        if (olLayers.length === 0) {
            console.warn('lizRefreshLayers - No layers found to refresh');
            return true;
        }
        OL_LAYERS.push(...olLayers);

        // Set timer to refresh layers every N milliseconds
        (function loop() {
        setTimeout(() => {
            refreshLayers(olLayers),
            loop();
        }, REFRESH_INTERVAL_MS);
        })();
    }

    /**
     * Wait for lizMap and mainLizmap objects to be available
     * @returns {Promise<boolean>}
     */
    function waitForObject() {
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                if (lizMap && lizMap.mainLizmap && lizMap.mainLizmap.map) {
                    clearInterval(intervalId);
                    resolve(true);
                }
            }, 200); // Check every 200 milliseconds for availability of listed objects
        });
    }

    // Start when lizMap and mainLizmap are available
    waitForObject().then((response) => {
        init();
    });

    // Public API
    let obj = {
        olLayers: OL_LAYERS,
        refreshLayers: refreshLayers,
    }

    return obj;

}();
