/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

// Parameters
const EXTERNAL_LIZMAP_WMTS_MAP_PROJECTION = 'EPSG:2154';
const EXTERNAL_LIZMAP_WMTS_URL = 'https://my-lizmap.com/index.php/lizmap/service/?repository=services&project=wmts&SERVICE=WMTS&REQUEST=GetCapabilities';
const EXTERNAL_LIZMAP_WMTS_REPLACEMENT = {
    'openstreetmap': 'openstreetmap',
    'cadastre': 'cadastre',
    'pcrs': 'pcrs'
};

lizMap.events.on({
    'uicreated':function(evt){

        // Fetch given URL
        fetch(EXTERNAL_LIZMAP_WMTS_URL)
        .then(function (response) {
            return response.text();
        })
        .then(function (wmtsCapabilities) {

            // Register proj 2154
            // lizMap.proj4.defs(EXTERNAL_LIZMAP_WMTS_MAP_PROJECTION,lizProj4[EXTERNAL_LIZMAP_WMTS_MAP_PROJECTION]);
            // lizMap.ol.proj.proj4.register(lizMap.proj4);

            // Get OL WMTS parser and read XML
            const parser = new lizMap.ol.format.WMTSCapabilities();
            const result = parser.read(wmtsCapabilities);

            // Get current OpenLayers collection of baselayers
            const baseLayerCollection = lizMap.mainLizmap.baseLayersMap._baseLayersGroup.getLayers();
            let layerIndexes = {};

            // For each target baselayer, build a WMTS replacement
            baseLayerCollection.forEach((layer, i) => {
                const baseLayer = layer;
                const baseLayerName = baseLayer.get('name');
                if (!(baseLayerName in EXTERNAL_LIZMAP_WMTS_REPLACEMENT)) {
                    return;
                }
                const replacementName = EXTERNAL_LIZMAP_WMTS_REPLACEMENT[baseLayerName];

                // Get options from WMTS GetCapabilities
                const options = lizMap.ol.source.WMTS.optionsFromCapabilities(result, {
                    layer: replacementName,
                    matrixSet: 'EPSG:2154'
                });

                // Create source from options
                const newSource = new lizMap.ol.source.WMTS(options);

                // Create layer from source
                const newBaseLayer = new lizMap.ol.layer.Tile({
                    source: newSource
                });

                // Set layer properties
                newBaseLayer.setOpacity(baseLayer.get('opacity'));
                newBaseLayer.setProperties({
                    name: baseLayerName,
                    title: baseLayer.get('title'),
                    visible: baseLayer.get('visible')
                });
                newBaseLayer.getSource().setProperties({
                    name: baseLayerName
                });

                // Set z-index
                newBaseLayer.setZIndex(baseLayer.getZIndex());

                // Add the replacement layer in the object
                layerIndexes[i] = newBaseLayer;

            });

            // Replace old base layer with the new one by modifying the OL collection
            for (const [i, layer] of Object.entries(layerIndexes)) {
                baseLayerCollection.setAt(i, layer);
                console.log(`${i}: ${layer.get('name')} has been replaced`);
            }
        });
    }
})
