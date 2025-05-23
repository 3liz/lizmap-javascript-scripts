/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

var lizmapIgnAltimetrie = function() {
    //IGN KEYS MUST BE DEFINED inside credential json file !
    var ignServiceKey;
    var ignServiceUrl;
    var ignEntryPoints;
    var help = 'Veuillez cliquer sur la carte <br />pour connaitre l\'altitude';

    lizMap.events.on({
            'uicreated': function(e) {
            lizMap.addDock('ign_altimetrie', 'Altimétrie', 'minidock', help, 'icon-screenshot');
            var credencial = OpenLayers.Util.urlAppend(
                 lizUrls.media,
                 OpenLayers.Util.getParameterString({
                 "repository": lizUrls.params.repository,
                 "project": lizUrls.params.project,
                 "path": "media/js/".concat(lizUrls.params.project,"/credencial.json")
                 })
            );

            $.getJSON(credencial, function(json) {

                ignServiceKey = json.ignServiceKey;
                ignServiceUrl = json.ignServiceUrl;
                ignEntryPoints = json.services.alti.ignEntryPoints;

                initIgnAltiView();
            });
        }
    });

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
        //IGN Web Service only allows coordinates in 4326
        if(lizMap.map.projection.projCode != "EPSG:4326"){
            var fromProjection = new OpenLayers.Projection(lizMap.map.projection.projCode);
            var toProjection = new OpenLayers.Projection("EPSG:4326");
            var convertedPoint = new OpenLayers.LonLat(lon, lat);
            convertedPoint.transform(fromProjection, toProjection);
            lon = convertedPoint.lon;
            lat = convertedPoint.lat;
        }

        var qParams = {
            'lon': lon,
            'lat':lat,
            'srs': lizMap.map.projection.projCode
        }
        getIgnJsonResponse('alti', qParams, function(data){
            var alt = data['elevations'][0]['z'];
            $('#ign_altimetrie .menu-content').html('Altitude :'.concat(' ',alt));
        });
    }

    function initIgnAltiView() {
        var map = lizMap.map;

        //Layer to display clic location
        var ignLayerAlti = map.getLayersByName('ignLayerAlti');
        if ( ignLayerAlti.length == 0 ) {
            ignLayerAlti = new OpenLayers.Layer.Vector('ignLayerAlti',{
                styleMap: new OpenLayers.StyleMap({
                    graphicName: 'cross',
                    pointRadius: 6,
                    fill: true,
                    fillColor: 'white',
                    fillOpacity: 1,
                    stroke: true,
                    strokeWidth: 2,
                    strokeColor: 'red',
                    strokeOpacity: 1
                })
            });
            map.addLayer(ignLayerAlti);
            ignLayerAlti.setVisibility(true);
        }

        OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
            defaultHandlerOptions: {
                'single': true,
                'double': false,
                'pixelTolerance': 0,
                'stopSingle': false,
                'stopDouble': false
            },

            initialize: function(options) {
                this.handlerOptions = OpenLayers.Util.extend(
                {}, this.defaultHandlerOptions
                );
                OpenLayers.Control.prototype.initialize.apply(
                this, arguments
                );
                this.handler = new OpenLayers.Handler.Click(
                this, {
                    'click': this.trigger
                }, this.handlerOptions
                );
            },

            trigger: function(e) {
                ignLayerAlti.destroyFeatures();
                $('#ign_altimetrie .menu-content').html( 'Altitude :'.concat(' ', '...') );
                var lonlat = map.getLonLatFromPixel(e.xy);
                ignLayerAlti.addFeatures([
                    new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
                    )
                ]);
                getIgnAlti(lonlat.lon,lonlat.lat)
            }

        });
        var click = new OpenLayers.Control.Click();
        map.addControl(click);

        lizMap.events.on({
            minidockopened: function(e) {
                    if ( e.id == 'ign_altimetrie' ) {
                    click.activate();
                    }
            },
                minidockclosed: function(e) {
                    if ( e.id == 'ign_altimetrie' ) {
                    $('#ign_altimetrie .menu-content').html(help);
                    ignLayerAlti.destroyFeatures();
                    ignLayerAlti.setVisibility(false);
                    click.deactivate();
                    }
            }
        });
    }

    return {
        'serviceKey': ignServiceKey,
        'serviceUrl': ignServiceUrl,
        'entryPoints': ignEntryPoints
    };
}();