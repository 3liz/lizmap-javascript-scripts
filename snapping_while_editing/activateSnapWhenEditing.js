lizSnapEdition = function(){

    // Options
    var snapLayerName = '';

    var snapLayers = {
	     'Quartiers' : {
         'layers': [
            'SousQuartiers'
        ],
        snapToNode: true,
        snapToEdge: false,
        snapToVertex: true
       },
	     'SousQuartiers' : {
         'layers': [
            'Quartiers'
        ],
        snapToNode: true,
        snapToEdge: false,
        snapToVertex: true
       }
    }

    var snapRestrictToMapExtent = true;
    var snapMaxFeatures = 1000;
    var snapTolerance = 40;
    var snapToNode = true;
    var snapToVertex = true;
    var snapToEdge = false;
    var snapColor = 'red';

    lizMap.events.on({
        'uicreated':function(evt){

            // Create layer to store snap features
            lizMap.map.addLayer(new OpenLayers.Layer.Vector('snaplayer',{
                styleMap: new OpenLayers.StyleMap({
                    pointRadius: 2,
                    fill: false,
                    stroke: true,
                    strokeWidth: 3,
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
                    snapTolerance: 15,
                    node: snapToNode,
                    vertex: snapToVertex,
                    edge: snapToEdge
                }]
            });
            lizMap.map.addControls([snapControl]);
            lizMap.controls['snapControl'] = snapControl;

        },

        'lizmapeditionformdisplayed': function(evt){
            // Get layer config
            var getLayerConfig = lizMap.getLayerConfigById(evt['layerId']);

            // verifiying  related children objects
            if ( !getLayerConfig )
              return true;
            var layerConfig = getLayerConfig[1];
            var featureType = getLayerConfig[0];

            var getSnapLayer = snapLayers[featureType]['layers'];

            // Get features for the current extent
            // Max 1000 features

            var snapLayer = lizMap.map.getLayersByName('snaplayer')[0];
            snapLayer.destroyFeatures();
            for(var i=0; i<getSnapLayer.length; i++){
              snapLayerName = getSnapLayer[i];
              console.log(snapLayerName);
              lizMap.getFeatureData(snapLayerName, null, null, 'geom', snapRestrictToMapExtent, null, snapMaxFeatures,
                  function(fName, fFilter, fFeatures, fAliases) {
                      // Transform features
                      console.log('ok');

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
                      snapLayer.addFeatures( tfeatures );

                      // Activate snapping
                      var snapControl = lizMap.controls.snapControl;
                      snapControl.deactivate();
                      snapControl.targets[0].edge = snapLayers[featureType].snapToEdge;
                      snapControl.targets[0].node = snapLayers[featureType].snapToNode;
                      snapControl.targets[0].vertex = snapLayers[featureType].snapToVertex;
                      snapControl.activate();
                      return false;
              });
            }

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
