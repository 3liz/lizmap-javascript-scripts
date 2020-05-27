var lizmapIgnAltimetrieProfil = function() {
    //IGN KEYS MUST BE DEFINED inside credencial json file !
    var ignServiceKey;
    var ignServiceUrl;
    var ignEntryPoints;
    var scriptPath = document.currentScript;

    lizMap.events.on({
            'uicreated': function(e) {
            lizMap.addDock('ign_altimetrie_profil', 'Profil Altimétrique', 'minidock', 'Veuillez cliquer sur la carte <br /> pour définir un point de départ un point d\'arrivé', 'icon-screenshot');
            credencial = getCredentialPath();
            $.getJSON(credencial, function(json) {
                ignServiceKey = json.ignServiceKey;
                ignServiceUrl = json.ignServiceUrl;
                ignEntryPoints = json.services.alti.ignEntryPoints;
                initIgnAltiProfilView();
            });
        }
    });

    function getCredentialPath(){
        var splitScriptPath  = scriptPath.src.split("%2F");
        var jsDirPath = splitScriptPath.slice(0, splitScriptPath.length - 1).join("/") + "/";
        var credencial = jsDirPath.concat('credencial.json');
        return credencial;
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

    function initIgnAltiView() {
        var map = lizMap.map;

         var html = '<button">Réinitialiser</button>';
        html.insertAfter( $('#ign_altimetrie_profil ign_altimetrie_profil h3') )  ;

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