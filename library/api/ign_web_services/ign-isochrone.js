var lizmapIgnIsochrone = function () {
    var ignServiceKey = 'essentiels';
    var ignServiceUrl = 'https://wxs.ign.fr/';
    var ignEntryPoints = {
        'isochrone': 'calcul/isochrone/isochrone.json?',
        'routing': null
    };
    var maxIsochroneValues = {
        'Pieton': {
            'time': 120,
            'distance': 10000
        },
        'Voiture': {
            'time': 30,
            'distance': 20000
        }
    }

    lizMap.events.on({
        'uicreated': function (e) {

            var html = '<span style="font-size:0.8em;font-weight:bold;">Renseignez les paramètres ci-dessous<br/>et cliquez ou déplacez le point</span>';
            html += '<br/>';
            html += '<br/>';
            html += '<div id="ign_isochrone_form_container" style="">';

            html += '<form class="" id="ign_isochrone_form">';

            // A pied ou en voiture
            html += '<div class="control-group">';

            //html+= '    <label class="control-label" for="ign_form_graphName">Moyen de locomotion</label>';
            html += '    <div class="controls">';
            html += '        <select id="ign_form_graphName" class="form-control" name="graphName">';
            html += '            <option selected value="Pieton">A pied</option>';
            html += '            <option value="Voiture">En voiture</option>';
            html += '        </select>';
            html += '    </div>';
            //html+= '</div>';

            // Méthode
            //html+= '<div class="control-group">';
            //html+= '    <label class="sr-only" for="ign_form_method">Méthode</label>';
            html += '    <div class="controls">';
            html += '        <select id="ign_form_method" class="form-control" name="method">';
            html += '            <option selected value="distance">Distance</option>';
            html += '            <option value="time">Durée</option>';
            html += '        </select>';
            html += '    </div>';
            //html+= '</div>';

            // Distance ou temps
            //html+= '<div class="control-group">';
            html += '    <div class="controls input-append">';
            html += '        <input id="ign_form_valeur" class="form-control span2"  name="valeur" type="number" value="2000"  min="1" max="' + maxIsochroneValues['Pieton']['distance'] + '" placeholder="Valeur">'
            html += '        <span class="add-on">mètres</span>';
            html += '    </div>';
            //html+= '</div>';


            // Reverse
            //html+= '<div class="control-group">';
            html += '    <div class="controls">';
            html += '    <label class="checkbox">';
            html += '        <input id="ign_form_reverse" class="form-control" name="reverse" type="checkbox">';
            html += '    La position est un point d\'arrivée';
            html += '    </label>';
            html += '    </div>';

            html += '</div>';

            html += '</form>'
            html += '</div>'

            lizMap.addDock(
                'ign_isochrone',
                'Isochrone (ign)',
                'minidock',
                html,
                'icon-road'
            );

            initIgnView();

        }
    });

    function getIgnIsochrone(geom) {

        var map = lizMap.map;

        var qParams = {
            'location': geom.x + ',' + geom.y,
            'method': $('#ign_form_method').val(), // time|distance
            'graphName': $('#ign_form_graphName').val(), // Voiture|Pieton
            'exclusions': '', // Toll|Tunnel
            'time': $('#ign_form_valeur').val() * 60,
            'distance': $('#ign_form_valeur').val(),
            'holes': 'true',
            'smoothing': 'true',
            'srs': lizMap.map.projection.projCode,
            'reverse': $('#ign_form_reverse').is(':checked')
        }
        //console.log(qParams);

        getIgnJsonResponse('isochrone', qParams, function (data) {
            //console.log(data.wktGeometry);

            // Add result to the map
            //console.log(ign_result);
            var resLayers = map.getLayersByName('ign-result');
            if (resLayers.length == 1) {
                var resLayer = resLayers[0];
                resLayer.destroyFeatures();
                var geometry = OpenLayers.Geometry.fromWKT(data.wktGeometry);
                geometry.transform(data.srs, resLayer.projection);
                var rfeature = new OpenLayers.Feature.Vector(geometry);
                resLayer.addFeatures([rfeature]);
            }

        });

    }

    function getIgnJsonResponse(service, params, aCallback) {
        var fullUrl = '';
        var ep = ignEntryPoints[service];
        var fullUrl = ignServiceUrl + ep;

        $.get(fullUrl,
            params,
            function (data) {
                //console.log(data);
                if (aCallback) {
                    aCallback(data);
                }
            }
            , 'json'
        );
    }

    function initIgnView() {

        var map = lizMap.map;

        // get or create IGN layer
        var layer = map.getLayersByName('ign-query');
        var ign_result = map.getLayersByName('ign-result');
        if (layer.length == 0) {

            ign_result = new OpenLayers.Layer.Vector('ign-result', {
                styleMap: new OpenLayers.StyleMap({
                    graphicName: 'circle',
                    pointRadius: 6,
                    fill: true,
                    fillColor: 'lightblue',
                    fillOpacity: 0.3,
                    stroke: true,
                    strokeWidth: 3,
                    strokeColor: 'blue',
                    strokeOpacity: 0.8
                })
            });
            map.addLayer(ign_result);

            layer = new OpenLayers.Layer.Vector('ign-query', {
                styleMap: new OpenLayers.StyleMap({
                    graphicName: 'circle',
                    pointRadius: 8,
                    fill: true,
                    fillColor: 'green',
                    fillOpacity: 0.6,
                    stroke: true,
                    strokeWidth: 3,
                    strokeColor: 'lightgreen',
                    strokeOpacity: 1
                })
            });
            map.addLayer(layer);

        } else {
            return;
        }
        layer.setVisibility(false);
        ign_result.setVisibility(false);

        var drawCtrl = new OpenLayers.Control.DrawFeature(layer,
            OpenLayers.Handler.Point, {
            eventListeners: {
                activate: function (evt) {
                    layer.destroyFeatures();
                    layer.setVisibility(true);
                    ign_result.destroyFeatures();
                    ign_result.setVisibility(true);
                },
                deactivate: function (evt) {
                }
            }
        }
        );

        var dragCtrl = new OpenLayers.Control.DragFeature(layer, {
            geometryTypes: ['OpenLayers.Geometry.Point'],
            type: OpenLayers.Control.TYPE_TOOL,
            layout: null,
            eventListeners: {
                activate: function (evt) {
                    if (this.layout == null)
                        return false;
                    layer.setVisibility(true);
                    ign_result.setVisibility(true);
                },
                deactivate: function (evt) {
                    layer.setVisibility(false);
                    ign_result.setVisibility(false);
                    layer.destroyFeatures();
                    ign_result.destroyFeatures();
                }
            },
            onComplete: function (feature, pixel) {
                layer.events.triggerEvent("featuremodified",
                    { feature: feature });
            }
        });
        map.addControls([drawCtrl, dragCtrl]);


        layer.events.on({
            featureadded: function (evt) {
                // deactivate draw
                drawCtrl.deactivate();

                // get feature
                var feat = layer.features[0];

                // clone geometry
                var geom = feat.geometry;
                //geom.transform( layer.projection,'EPSG:4326' );

                // Query server
                getIgnIsochrone(geom);

                // activate drag
                dragCtrl.activate();

                // update message
                //$('#lizmap-measure-message').remove();
                //lizMap.addMessage('Vous pouvez déplacez la position du point de départ sur la carte.', 'info', true)).attr('id','lizmap-ign-message');
            },
            featuremodified: function (evt) {

                //console.log('FEATURE MODIFIED');
                // get feature
                var feat = evt.feature;

                // clone geometry
                var geom = feat.geometry;

                // Query server
                getIgnIsochrone(geom);

            }
        });


        // Detect changes on form
        $('#ign_isochrone_form').submit(function () {
            return false;
        });
        $('#ign_isochrone_form input, #ign_isochrone_form select').change(function () {
            //console.log('CHANGED');

            // Change max value
            var graphName = $("#ign_form_graphName").val();
            var method = $("#ign_form_method").val();
            var maxVal = maxIsochroneValues[graphName][method];
            var mVal = $("#ign_form_valeur").val();
            if (mVal > maxVal) {
                $("#ign_form_valeur").val(maxVal)
            }
            $("#ign_form_valeur").attr('max', maxVal);
            if (method == 'distance') {
                $("#ign_form_valeur").next('span').text('mètres');
            } else {
                $("#ign_form_valeur").next('span').text('minutes');
            }

            // Mimic feature modified
            var features = {};
            var feat = null;
            for (var fid in layer.features) {
                feat = layer.features[fid];
                break;
            }
            layer.events.triggerEvent(
                "featuremodified",
                { feature: feat }
            );
        });

        lizMap.events.on({
            minidockopened: function (e) {
                if (e.id == 'ign_isochrone') {
                    drawCtrl.activate();
                    //$('#lizmap-measure-message').remove();
                    //lizMap.addMessage('Cliquer sur la carte pour générer l\'isochrone (vérifiez vos paramètres)', 'info', true)).attr('id','lizmap-ign-message');
                }
            },
            minidockclosed: function (e) {
                if (e.id == 'ign_isochrone') {
                    drawCtrl.deactivate();
                    dragCtrl.deactivate();
                }
            }
        });


    }

    return {
        'serviceUrl': ignServiceUrl,
        'entryPoints': ignEntryPoints,
        'maxIsochroneValues': maxIsochroneValues
    };
}();
