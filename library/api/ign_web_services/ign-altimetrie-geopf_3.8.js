const lizmapIgnAltimetrie = function() {

    // ID of the dock (do not change)
    const DOCK_ID = 'ign_altimetrie';
    // Icon of the dock menu and used before each link
    // See https://getbootstrap.com/2.3.2/base-css.html#icons
    const DOCK_ICON = 'icon-screenshot';
    // Dock position: can be dock, minidock, right-dock
    const DOCK_POSITION = 'minidock';
    // Title of the dock
    const DOCK_TITLE = 'Altimétrie';
    // Description displayed at the top of the dock content
    const DOCK_DESCRIPTION = 'Altitude du point';
    // Description displayed when waiting for result
    const DOCK_WAIT = 'En attente du résultat d\'altitude du point';
    // Sentence used when no click has been made on the map yet
    const DOCK_PLEASE_CLICK = 'Veuillez cliquer sur la carte <br />pour connaitre l\'altitude.';

    //
    let _map = null;
    let _drawLayer = null;

    // Styles tels que définis par OpenLayers
    // https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html
    let _drawStyle = {
        'circle-radius': 8,
        'circle-stroke-color': 'lightgreen',
        'circle-stroke-width': 3,
        'circle-fill-color': 'rgba(0,128,0,0.6)' //green
    };

    const ignServiceKey = '';
    const ignServiceUrl = 'https://data.geopf.fr/';
    const ignEntryPoints = "/altimetrie/1.0/calcul/alti/rest/elevation.json?resource=ign_rge_alti_wld";

    const help = 'Veuillez cliquer sur la carte <br />pour connaitre l\'altitude';

    lizMap.events.on({
        'uicreated': function(e) {

            lizMap.addDock(
                DOCK_ID,
                DOCK_TITLE,
                DOCK_POSITION,
                DOCK_PLEASE_CLICK,
                DOCK_ICON);
            initIgnAltiView();
        }
    });

    function buildHtml(longitude = null, latitude = null, altitude = null) {
        let dockHtml = '';
        if (longitude && latitude) {
            dockHtml += `<p style="padding: 5px;">${DOCK_DESCRIPTION}</p>`;
            dockHtml += `<p style="padding: 5px;"><b>Longitude</b> : ${longitude}`;
            dockHtml += `<br><b>Latitude</b> : ${latitude}`;
            dockHtml += `<br><b>Altitude</b> : ${altitude}</p>`;
        } else {
            dockHtml += `<p style="padding: 5px; font-style: italic; font-size: 0.8em; background: lightgray;">${DOCK_PLEASE_CLICK}</p>`;
        }

        return dockHtml;
    }

    function getIgnJsonResponse(service, params, aCallback){
        var fullUrl = '';
        var ep = ignEntryPoints;
        var fullUrl = ignServiceUrl + ignServiceKey + ep;
        $.get(
            fullUrl,
            params,
            function(data) {
                if(aCallback){
                        aCallback(data);
                }
            }
            ,'json'
        );
    }

    function getIgnAlti(lon,lat){
        $('#'+DOCK_ID+' .menu-content').html(
            `<p style="padding: 5px; font-style: italic; font-size: 0.8em; background: lightgray;">${DOCK_WAIT}</p>`
        );
        var qParams = {
            'lon': lon,
            'lat':lat,
            'srs': lizMap.map.projection.projCode
        }
        getIgnJsonResponse('alti', qParams, function(data){
            var alt = data['elevations'][0]['z'];
            $('#'+DOCK_ID+' .menu-content').html(buildHtml(lon,lat,alt));
        });
    }

    /**
     * Refresh the content of the external links dock
     * every time the user clicks on the map
     *
     * @param event Click event
     */
    function onMapClick(event) {
        // update panel only if active
        if (document.getElementById(DOCK_ID).classList.contains('active')) {
            _drawLayer.getSource().clear();
            let point  = new lizMap.ol.geom.Point(event.coordinate);
            _drawLayer.getSource().addFeature(
                new lizMap.ol.Feature({
                    geometry: point.clone()
                })
            )
            // draw point in this._drawLayer
            if(lizMap.map.projection.projCode != "EPSG:4326"){
                // reproject point to 4326
                point.transform(lizMap.map.projection.projCode, 'EPSG:4326');
            }

            const longitude = point.getCoordinates()[0].toFixed(6);
            const latitude = point.getCoordinates()[1].toFixed(6);
            getIgnAlti(longitude, latitude);
        }
    }

    function onDockClosed(clickeDockId)
    {
        if (clickeDockId == DOCK_ID) {
            // external link dock closed : enable popup behaviour
            lizMap.mainLizmap.popup.active = true;
            // Reset content
            $('#'+DOCK_ID+' .menu-content').html(buildHtml());
            // Clear draw layer
            _drawLayer.getSource().clear();
        }
    }

    function onDockOpened(clickeDockId)
    {
        if (clickeDockId == DOCK_ID) {
            // external link dock closed : disable popup behaviour
            lizMap.mainLizmap.popup.active = false;
        }
    }

    function initIgnAltiView() {
        _map = lizMap.mainLizmap.map;

        _drawLayer = new lizMap.ol.layer.Vector({
            source: new lizMap.ol.source.Vector({
                wrapX: false
            }),
            style: _drawStyle
        });
        _map.addToolLayer(_drawLayer);

        // Register a click on OpenLayers > 2 map
        _map.on('singleclick', onMapClick);

        lizMap.events.on({
            dockopened: function(e) {
                onDockOpened(e.id);
            },
            minidockopened: function(e) {
                onDockOpened(e.id);
            },
            rightdockopened: function(e) {
                onDockOpened(e.id);
            },
            // Dock closed
            dockclosed: function(e) {
                onDockClosed(e.id);
            },
            minidockclosed: function(e) {
               onDockClosed(e.id);
            },
            rightdockclosed: function(e) {
                onDockClosed(e.id);
            }
        });
    }

    return {
        'id': DOCK_ID,
        'title': DOCK_TITLE,
        'serviceUrl': ignServiceUrl,
        'entryPoints': ignEntryPoints
    };
}();