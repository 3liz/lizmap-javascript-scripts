lizMap.events.on({
    'uicreated': function(e) {
        // decalre here your google maps key compatible with google street view
        var gkey = '';
        $('body').append('<script async defer src="https://maps.googleapis.com/maps/api/js?key=&callback=initGoogleStreetView">');
    }
});
function initGoogleStreetView() {
    // Google maps initialize
    var map = lizMap.map;

    // get Google Street View layer
    var layer = map.getLayersByName('google-street-view');
    if ( layer.length == 0 ) {
        layer = new OpenLayers.Layer.Vector('google-street-view',{
            styleMap: new OpenLayers.StyleMap({
                graphicName: 'triangle',
                pointRadius: 6,
                fill: true,
                fillColor: 'yellow',
                fillOpacity: 0.4,
                stroke: true,
                strokeWidth: 3,
                strokeColor: 'yellow',
                strokeOpacity: 0.8,
                rotation: "${angle}"
            })
        });
        map.addLayer(layer);
    } else {
        return;
    }
    layer.setVisibility(false);

    var drawCtrl = new OpenLayers.Control.DrawFeature(layer,
        OpenLayers.Handler.Point,{
            eventListeners: {
                activate: function(evt) {
                    layer.destroyFeatures();
                    layer.setVisibility(true);
                },
                deactivate:  function(evt) {
                }
            }
        }
    );

    var dragCtrl = new OpenLayers.Control.DragFeature(layer,{
        geometryTypes: ['OpenLayers.Geometry.Point'],
        type:OpenLayers.Control.TYPE_TOOL,
        layout: null,
        eventListeners: {
            activate: function(evt) {
                if (this.layout == null)
                    return false;
                layer.setVisibility(true);
            },
            deactivate: function(evt) {
                layer.setVisibility(false);
                layer.destroyFeatures();
            }
        },
        onComplete: function(feature, pixel) {
            layer.events.triggerEvent("featuremodified",
                                       {feature: feature});
        }
    });
    map.addControls([drawCtrl, dragCtrl]);


    layer.events.on({
        featureadded: function(evt) {
            // deactivate draw
            drawCtrl.deactivate();

            // get feature
            var feat = layer.features[0];

            // clone geometry
            var geom = feat.geometry.clone();
            geom.transform( layer.projection,'EPSG:4326' );

            // Set Panorama
            panorama.setPosition({lat: geom.y, lng: geom.x});
            panorama.setVisible(true);

            // Update feature
            feat.attributes.angle = panorama.getPov().heading;
            layer.redraw();

            // activate drag
            dragCtrl.activate();

            // update message
            $('#gsv-message').html('<p>Vous pouvez déplacez la position de votre vue sur la carte.</p>');
        },
        featuremodified: function(evt) {
            // get feature
            var feat = evt.feature;

            // clone geometry
            var geom = feat.geometry.clone();
            geom.transform( layer.projection,'EPSG:4326' );

            // Set Panorama
            panorama.setPosition({lat: geom.y, lng: geom.x});
            panorama.setVisible(true);

            // Update feature
            feat.attributes.angle = panorama.getPov().heading;
            layer.redraw();

        }
    });


    var html = '<h4>Panorama</h4>';
    html += '<div id="gsv-pano" style="width:400px; height:300px;"></div>';

    lizMap.addDock(
        'gsv',
        'Street view',
        'minidock',
        html,
        'icon-road'
    );

    var message = '<div id="gsv-message" class="alert alert-block alert-info fade in" data-alert="alert">';
    message += '<p></p>';
    message += '</div>';
    $('#gsv > div.menu-content').prepend(message);

    var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('gsv-pano'), {
                      position: {lat: 37.869, lng: -122.255},
                      visible: false
                });
    panorama.addListener('position_changed', function() {
        if ( layer.features.length == 0 )
            return;

        var pos = panorama.getPosition();
        var pt = new OpenLayers.Geometry.Point( pos.lng(), pos.lat() );
        pt.transform( 'EPSG:4326', layer.projection );

        var feat = layer.features[0];
        feat.geometry.x = pt.x;
        feat.geometry.y = pt.y;
        layer.redraw();

        if ( !map.getExtent().scale(0.95).contains(pt.x, pt.y) ){
            map.setCenter([pt.x, pt.y]);
        }
        return;
    });
    panorama.addListener('pov_changed', function() {
        if ( layer.features.length == 0 )
            return;

        layer.features[0].attributes.angle = panorama.getPov().heading;
        layer.redraw();
        return;
    });


    lizMap.events.on({
        minidockopened: function(e) {
            if ( e.id == 'gsv' ) {
                drawCtrl.activate();
                $('#gsv-message').html('<p>Click on the map to localize your view.</p>');
            }
        },
        minidockclosed: function(e) {
            if ( e.id == 'gsv' ) {
                drawCtrl.deactivate();
                dragCtrl.deactivate();
                panorama.setVisible(false);
            }
        }
    });
}