lizMap.events.on({
    'uicreated':function(evt){

        var EXTERNAL_LIZMAP_WMTS_URL = 'https://my-lizmap.com/index.php/lizmap/service/?repository=services&project=wmts&SERVICE=WMTS&REQUEST=GetCapabilities';
        var EXTERNAL_LIZMAP_REPLACEMENT = {
            'openstreetmap': 'openstreetmap',
            'topographie': 'topographie',
            'cadastre': 'cadastre',
            'pcrs': 'pcrs'
        };

        OpenLayers.Request.GET({
            url: EXTERNAL_LIZMAP_WMTS_URL,
            params: {
                SERVICE: "WMTS",
                VERSION: "1.0.0",
                REQUEST: "GetCapabilities"
            },
            success: function(request) {
                var doc = request.responseXML;
                if (!doc || !doc.documentElement) {
                    doc = request.responseText;
                }
                var wmtsFormat = new OpenLayers.Format.WMTSCapabilities({});
                var wmtsCapabilities = wmtsFormat.read(doc);
                var wmtsLayer = null;
                var layers = wmtsCapabilities.contents.layers;

                for(var R_LAYER_NAME in EXTERNAL_LIZMAP_REPLACEMENT){
                    var LAYER_NAME = EXTERNAL_LIZMAP_REPLACEMENT[R_LAYER_NAME];

                    for (var i=0; i< layers.length; i++) {
                        var layer = layers[i];
                        if (layer.identifier == LAYER_NAME) {

                            var out = document.getElementById('output');

                            // Find index of the layer to be replaced
                            var rlayerget = lizMap.map.getLayersByName(R_LAYER_NAME)
                            if(rlayerget.length == 1){

                                // Get layer to be replaced
                                var rlayer = rlayerget[0];

                                // Get layer index
                                var rlayer_index = lizMap.map.getLayerIndex(rlayer)

                                var wmtsOptions = {
                                    name: R_LAYER_NAME,
                                    layer: LAYER_NAME,
                                    matrixSet: layer.tileMatrixSetLinks[0]['tileMatrixSet'],
                                    format: layer.formats[0],
                                    opacity: 1,
                                    alwaysInRange: false,
                                };
                                // Use old layer config
                                wmtsOptions['zoomOffset'] = rlayer.zoomOffset;
                                wmtsOptions['maxResolution'] = rlayer.maxResolution;
                                wmtsOptions['numZoomLevels'] = rlayer.numZoomLevels;
                                wmtsOptions['minZoomLevel'] = rlayer.minZoomLevel;
                                wmtsOptions['resolutions'] = rlayer.resolutions;
                                wmtsOptions['isBaseLayer'] = rlayer.isBaseLayer;
                                wmtsOptions['attribution'] = rlayer.attribution;
                                wmtsOptions['singleTile'] = false;
                                wmtsOptions['params'] = rlayer.params;

                                // Add replacement layer
                                var wmtsLayer = wmtsFormat.createLayer(wmtsCapabilities, wmtsOptions);
                                lizMap.map.addLayer(wmtsLayer);

                                // Set layer index
                                lizMap.map.setLayerIndex(wmtsLayer, rlayer_index);

                                if( lizMap.map.baseLayer.name == rlayer.name ){
                                    lizMap.map.baseLayer = wmtsLayer;
                                    // Force redraw
                                    lizMap.map.getLayersByName(R_LAYER_NAME)[0].visibility = true;
                                    lizMap.map.getLayersByName(R_LAYER_NAME)[0].redraw();
                                }

                                // Remove old layer
                                lizMap.map.removeLayer(rlayer);
                                rlayer.destroy();

                            }

                            break;
                        }
                    };
                }

            },
            failure: function() {
                console.log("Trouble getting WMTS capabilities document.");
                OpenLayers.Console.error.apply(OpenLayers.Console, arguments);
            }
        });

    }

});
