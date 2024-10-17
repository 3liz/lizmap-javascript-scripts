lizMap.events.on({
    uicreated: () => {
        // List of layer QGIS names to refresh
        const refreshLayersName = [
            'Quartiers',
            'SousQuartiers'
        ];

        // Refresh interval in milliseconds
        const refreshInterval = 10000;

        // ****
        // Do not edit below
        // ****

        // Get OL layers by name
        const olLayers = [];
        const olMap = lizMap.mainLizmap?.baseLayersMap /* Lizmap = 3.7 */  || lizMap.mainLizmap?.map /* Lizmap > 3.7 */;
        for (const layerName of refreshLayersName) {
            const olLayer = olMap.getLayerByName(layerName);
            olLayers.push(olLayer);
        }

        // Refresh all given layers
        function refreshLayers() {
            for (const olLayer of olLayers) {
                if (olLayer.getVisible()) {
                    olLayer.getSource().changed();
                }
            }
        }

        // Set timer to refresh layers every N milliseconds
        setInterval(refreshLayers, refreshInterval);
    }
});