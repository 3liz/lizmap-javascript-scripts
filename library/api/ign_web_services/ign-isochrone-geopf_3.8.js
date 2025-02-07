/**
 * Script permettant de dessiner un point sur la carte et d'afficher l'isochrone associé
 * @license Mozilla Public License Version 2.0
 * Ce script est compatible avec Lizmap 3.8.
 * Il n'y a aucune garantie de fonctionnement avec une autre version de Lizmap, l'API pouvant changer.
 */

var lizmapIgnIsochrone = function () {
    // Styles tels que définis par OpenLayers
    // https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html
    this._resultStyle = {
        'stroke-color': 'rgba(0, 0, 255, 0.8)', //blue
        'stroke-width': 3,
        'fill-color': 'rgba(173, 216, 230, 0.3)' //lightblue
    };

    this._drawStyle = {
        'circle-radius': 8,
        'circle-stroke-color': 'lightgreen',
        'circle-stroke-width': 3,
        'circle-fill-color': 'rgba(0,128,0,0.6)' //green
    };

    var ignServiceUrl = 'https://data.geopf.fr/';
    var ignEntryPoints = {
        'isochrone': 'navigation/isochrone?',
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
        uicreated: () => {

            var html = '<span style="font-size:0.7em;font-weight:bold;">Renseignez les paramètres ci-dessous<br/>et cliquez sur la carte (ou déplacez le point existant)</span>';
            html += '<br/>';
            html += '<br/>';
            html += '<div id="ign_isochrone_form_container" style="">';

            html += '<form class="" id="ign_isochrone_form">';

            // A pied ou en voiture
            html += '<div class="control-group">';

            html += '    <div class="controls">';
            html += '        <select id="ign_form_graphName" class="form-control" name="graphName">';
            html += '            <option selected value="Pieton">A pied</option>';
            html += '            <option value="Voiture">En voiture</option>';
            html += '        </select>';
            html += '    </div>';

            // Méthode
            html += '    <div class="controls">';
            html += '        <select id="ign_form_method" class="form-control" name="method">';
            html += '            <option selected value="time">Durée</option>';
            html += '            <option value="distance">Distance</option>';
            html += '        </select>';
            html += '    </div>';

            // Distance ou temps
            html += '    <div class="controls input-append">';
            html += '        <input id="ign_form_valeur" class="form-control span2"  name="valeur" type="number" value="15"  min="1" max="' + maxIsochroneValues['Pieton']['distance'] + '" placeholder="Valeur">'
            html += '        <span class="add-on">minutes</span>';
            html += '    </div>';

            // Reverse
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

    /**
     * Envoie une requête à l'API Isochrone de l'IGN et affiche la géométrie.
     * @param {Geometry} geom La géometrie du point dans la projection de la carte.
     */
    function getIgnIsochrone(geom) {
        geom = geom.transform(lizMap.mainLizmap.projection, 'EPSG:4326');
        $('#lizmap-ign-message').remove();
        lizMap.addMessage('Le calcul de l\'isochrone est en cours...', 'info', true).attr('id', 'lizmap-ign-message');
        const graphName = $('#ign_form_graphName').val();
        const method = $('#ign_form_method').val();
        const formValue = $('#ign_form_valeur').val();
        const finalValue = (method == 'distance') ? formValue : parseInt(formValue) * 60;
        const direction = ($('#ign_form_reverse').is(':checked')) ? 'arrival' : 'departure';
        var qParams = {
            resource: 'bdtopo-pgr',
            profile: (graphName == 'Voiture') ? 'car' : 'pedestrian',
            costType: method, // time|distance
            costValue: finalValue, // value
            direction: direction, // departure|arrival
            point: geom.getCoordinates()[0] + ',' + geom.getCoordinates()[1],
            geometryFormat: 'geojson'
        };

        getIgnJsonResponse('isochrone', qParams, data => {
            $('#lizmap-ign-message').remove();
            lizMap.addMessage('Le dessin en bleu représente la zone accessible avec les paramètres renseignés', 'info', true).attr('id', 'lizmap-ign-message');
            // Add result to the map
            this._ignResultLayer.getSource().clear();
            const resultGeom = (new lizMap.ol.format.GeoJSON()).readGeometry(data.geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: lizMap.mainLizmap.projection
            });
            this._ignResultLayer.getSource().addFeature(new lizMap.ol.Feature(resultGeom));
        });
    }

    function getIgnJsonResponse(service, params, aCallback) {
        var fullUrl = '';
        var ep = ignEntryPoints[service];
        var fullUrl = ignServiceUrl + ep;

        $.get(fullUrl,
            params,
            function (data) {
                if (aCallback) {
                    aCallback(data);
                }
            }
            , 'json'
        );
    }

    function initIgnView() {

        this._map = lizMap.mainLizmap.map;

        // Création des couches de dessin et de résultat
        this._ignResultLayer = new lizMap.ol.layer.Vector({
            source: new lizMap.ol.source.Vector({
                wrapX: false
            }),
            style: this._resultStyle
        });
        this._map.addToolLayer(this._ignResultLayer);

        this._drawLayer = new lizMap.ol.layer.Vector({
            source: new lizMap.ol.source.Vector({
                wrapX: false
            }),
            style: this._drawStyle
        });
        this._map.addToolLayer(this._drawLayer);

        this._drawInteraction = new lizMap.ol.interaction.Draw({
            type: 'Point',
            source: this._drawLayer.getSource(),
            style: this._drawStyle
        });

        this._drawInteraction.on('drawend', evt => {
            this._map.removeInteraction(this._drawInteraction);
            const drawnPoint = evt.feature.getGeometry().clone();
            getIgnIsochrone(drawnPoint);
        });

        this._modifyInteraction = new lizMap.ol.interaction.Modify({
            source: this._drawLayer.getSource()
        });

        this._modifyInteraction.on('modifyend', evt => {
            const drawnPoint = evt.features.getArray()[0].getGeometry().clone();
            getIgnIsochrone(drawnPoint);
        });

        // Detect changes on form
        $('#ign_isochrone_form').submit(function () {
            return false;
        });
        $('#ign_isochrone_form input, #ign_isochrone_form select').change(() => {
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

            const drawnFeature = this._drawLayer.getSource().getFeatures();

            if (drawnFeature.length > 0) {
                getIgnIsochrone(this._drawLayer.getSource().getFeatures()[0].getGeometry().clone());
            }      
        });

        lizMap.events.on({
            minidockopened: e => {
                if (e.id == 'ign_isochrone') {
                    lizMap.mainLizmap.popup.active = false;
                    lizMap.mainLizmap.map.addInteraction(this._drawInteraction);
                    lizMap.mainLizmap.map.addInteraction(this._modifyInteraction);
                }
            },
            minidockclosed: e => {
                if (e.id == 'ign_isochrone') {
                    lizMap.mainLizmap.popup.active = true;
                    this._drawLayer.getSource().clear();
                    this._ignResultLayer.getSource().clear();
                    lizMap.mainLizmap.map.removeInteraction(this._drawInteraction);
                    lizMap.mainLizmap.map.removeInteraction(this._modifyInteraction);
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