lizSnapEdition = function(){

    // Options
    var snapLayerName = 'Quartiers';
    var snapRestrictToMapExtent = true;
    var snapMaxFeatures = 1000;
    var snapTolerance = 20;
    var snapColor = 'cyan';

    lizMap.events.on({
        'uicreated':function(evt){

            // Create layer to store snap features
            lizMap.map.addLayer(new OpenLayers.Layer.Vector('snaplayer',{
                styleMap: new OpenLayers.StyleMap({
                    pointRadius: 1,
                    fill: false,
                    stroke: true,
                    strokeWidth: 2,
                    strokeColor: snapColor,
                    strokeOpacity: 0.8
                })
            }));
            var snapLayer = lizMap.map.getLayersByName('snaplayer')[0];
            var editionLayer = lizMap.map.getLayersByName('editLayer')[0];

            var snapControl = new OpenLayers.Control.Snapping({
                layer: editionLayer,
                targets: [{
                    layer: snapLayer,
                    snapTolerance: 15
                }]
            });
            lizMap.map.addControls([snapControl]);

        },

        'lizmapeditionformdisplayed': function(evt){
            // Get layer config


            // Get features for the current extent
            // Max 1000 features

            lizMap.getFeatureData(snapLayerName, null, null, 'geom', snapRestrictToMapExtent, null, snapMaxFeatures,
                function(fName, fFilter, fFeatures, fAliases) {
                    // Transform features
                    var snapLayerConfig = lizMap.config.layers[snapLayerName];
                    var snapLayerCrs = snapLayerConfig['featureCrs'];
                    if(!snapLayerCrs)
                        snapLayerCrs = snapLayerConfig['crs'];

                    var gFormat = new OpenLayers.Format.GeoJSON({
                        externalProjection: snapLayerCrs,
                        internalProjection: lizMap.map.getProjection()
                    });
                    var tfeatures = gFormat.read( {
                        type: 'FeatureCollection',
                        features: fFeatures
                    } );

                    // Add features
                    var snapLayer = lizMap.map.getLayersByName('snaplayer')[0];
                    snapLayer.destroyFeatures();
                    snapLayer.addFeatures( tfeatures );

                    // Activate snapping
                    var snapControl = lizMap.map.getControlsByClass('OpenLayers.Control.Snapping')[0];
                    snapControl.deactivate();
                    snapControl.activate();
                    return false;
                }
            );

        },

        'lizmapeditionformclosed': function(evt){
            var snapControl = lizMap.map.getControlsByClass('OpenLayers.Control.Snapping')[0];
            snapControl.deactivate();
            var snapLayer = lizMap.map.getLayersByName('snaplayer')[0];
            snapLayer.destroyFeatures();
        }
    });

    return true;

}();
