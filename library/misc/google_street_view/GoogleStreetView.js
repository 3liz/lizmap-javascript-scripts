lizMap.events.on({
    'uicreated': function(e) {
        // declare here your google maps key compatible with google street view
        var gkey = '';
        if ( typeof(google) == 'undefined' ) {
            $('body').append('<script async defer src="https://maps.googleapis.com/maps/api/js?key=' + gkey + '&callback=initGoogleStreetView">');
        } else {
            window.setTimeout(initGoogleStreetView, 1000);
        }
    }
});

function initGoogleStreetView() {

    var gsvMessageTimeoutId;
    var cleanGsvMessage = function() {
        var gsvMessage = $('#gsv-message');
        if ( gsvMessage.length != 0 ) {
            gsvMessage.remove();
        }
        gsvMessageTimeoutId = null;
    };
    var addGsvMessage = function (aMessage){
        if ( gsvMessageTimeoutId ) {
            window.clearTimeout(gsvMessageTimeoutId);
        }
        cleanGsvMessage()
        lizMap.addMessage(aMessage, 'info', true).attr('id','gsv-message');
        gsvMessageTimeoutId = window.setTimeout(cleanGsvMessage, 5000);
    };

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
            addGsvMessage( 'Vous pouvez déplacez la position de votre vue sur la carte.');
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


    var html = '<div id="gsv-pano"></div>';

    lizMap.addDock(
        'gsv',
        'Street view',
        'minidock',
        html,
        'icon-road'
    );

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
                // gsv is displayed in an absolute position, and set its width/height
                // regarding the width/height of its host (gsv-pano). So we must
                // set width/height of gsv-pano manually. These values depends
                // of the width/height of screen.
                var headerStyles = window.getComputedStyle(document.getElementById('header'))
                var height, width;

                if (headerStyles.display == 'none') {
                    // we are in the iframe mode. No header displayed
                    var mapStyles = window.getComputedStyle(document.getElementById('map'));
                    height = (parseFloat(mapStyles.height) * 45 / 100) - 15;
                    width = document.getElementById('mini-dock').getBoundingClientRect().width - 20 ;
                }
                else {
                    // we are in the normal mode
                    var sidemenuStyles = window.getComputedStyle(document.getElementById('mapmenu'))
                    var minidockStyles = window.getComputedStyle(document.getElementById('mini-dock'));
                    height = (parseFloat(sidemenuStyles.height) * 45 / 100) - 15;
                    width = ((parseFloat(headerStyles.width)-parseFloat(sidemenuStyles.width))  *  (parseFloat(minidockStyles.maxWidth)-1) / 100) -15;
                }

                var gsvPano = document.getElementById('gsv-pano');
                gsvPano.style.width = width+'px';
                gsvPano.style.height = height+'px';

                drawCtrl.activate();
                addGsvMessage( 'Cliquez sur la carte pour positionner votre vue.');
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
