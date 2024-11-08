lizMap.events.on({
    'uicreated': function(e) {
        // declare here your google maps key compatible with google street view
        var gkey = '_______________________$$$$$$$$$YOUR_KEY$$$$$$$$$_______________________';
        if ( typeof(google) == 'undefined' ) {
            $('body').append('<script async defer src="https://maps.googleapis.com/maps/api/js?key=' + gkey + '&callback=initGoogleStreetView">');
        } else {
            window.setTimeout(initGoogleStreetView, 1000);
        }
    }
});

class LizGoogleStreeView {
    constructor(mainLizmap, panorama) {
        this.mainLizmap = mainLizmap;
        this.panorama = panorama;

        this._gsvLayer = null;
        this._gsvFeature = null;

        this._drawColor = '#ff0000';
        this._pointRadius = 8;
        this._rotation = 0;

        this.addLayer();
        this.bindGSV();
    }

    bindGSV() {
        this.panorama.addListener('position_changed', () => {
                                                        var pos = this.panorama.getPosition();
                                                        var pt = new lizMap.ol.geom.Point([pos.lng(), pos.lat()]);
                                                        this.roamerSetPosition(pt);
                                                      });
        this.panorama.addListener('pov_changed', () => {
                                                  this._rotation = this.panorama.getPov().heading * (Math.PI/180);
                                                  this._gsvLayer.changed();
                                                 });
    }

    gsvSetPosition(geom){
        var geom4326 = geom.clone();
        geom4326.transform(this.mainLizmap.projection, "EPSG:4326");
        var coord = geom4326.getCoordinates();
        // update Panorama coord
        this.panorama.setPosition({lat: coord[1], lng: coord[0]}); 
    }

    roamerSetPosition(geom){
        var geomLiz = geom.clone();
        geomLiz.transform("EPSG:4326", this.mainLizmap.projection);
        var coord = geomLiz.getCoordinates();
        // update roaming marker coord
        this._gsvFeature.setGeometry(geomLiz);
    }

    addLayer() {
        var gsvLyrSource = new lizMap.ol.source.Vector({ wrapX: false });
        this._gsvLayer = new lizMap.ol.layer.Vector({
            source: gsvLyrSource
        });
        this._gsvLayer.setStyle(this.setFeatStyle())
        this._gsvLayer.setProperties({
            name: 'google-street-view'
        });
	this.mainLizmap.map.addToolLayer(this._gsvLayer);
    }

    activateStreetView(){
    	const value = "Point";
    	this._drawInteraction = new lizMap.ol.interaction.Draw({
	      source: this._gsvLayer.getSource(),
	      type: "Point",
	    });

	    this.mainLizmap.map.addInteraction(this._drawInteraction);
        this._mainLizmap.popup.active = false;
        
	    this._drawInteraction.on('drawend', event => {
	    	this.mainLizmap.map.removeInteraction(this._drawInteraction);
            this.mainLizmap.map.addInteraction(this._selectInteraction);
            this.mainLizmap.map.addInteraction(this._modifyInteraction);
            this._gsvFeature = event.feature;
            this.gsvSetPosition(this._gsvFeature.getGeometry());
            this.panorama.setVisible(true);
            setTimeout(() => {
              this._mainLizmap.popup.active = true;
            }, "1000");
	    });

	    this._selectInteraction = new lizMap.ol.interaction.Select({wrapX: false,
                                                                    style: this.setFeatStyle()});

	    this._modifyInteraction = new lizMap.ol.interaction.Modify({
            features: this._selectInteraction.getFeatures(),
        });

	    this._modifyInteraction.on('modifyend', event => {
            this.gsvSetPosition(event.features.getArray()[0].getGeometry());
	    });
    }

    deactivateStreetView(){
        this.panorama.setVisible(false);
    	this.mainLizmap.map.removeInteraction(this._drawInteraction);
	    this.mainLizmap.map.removeInteraction(this._selectInteraction);
        this.mainLizmap.map.removeInteraction(this._modifyInteraction);
        this._gsvLayer.getSource().clear();
    }

    setFeatStyle() {
    	var drawStyleFunction = (feature) => {
            //https://codebeautify.org/svg-to-base64-converter
            var svg_roamer = 'PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iNTBweCIgaGVpZ2h0PSI1MHB4IiB2aWV3Qm94PSItMTAyLjQgLTEwMi40IDEyMjguODAgMTIyOC44MCIgY2xhc3M9Imljb24iIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjMDAwMDAwIiB0cmFuc2Zvcm09InJvdGF0ZSgwKSI+Cg08ZyBpZD0iU1ZHUmVwb19iZ0NhcnJpZXIiIHN0cm9rZS13aWR0aD0iMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDAuOTU5OTk5OTk5OTk5OTgsNDAuOTU5OTk5OTk5OTk5OTgpLCBzY2FsZSgwLjkyKSI+Cg08cmVjdCB4PSItMTAyLjQiIHk9Ii0xMDIuNCIgd2lkdGg9IjEyMjguODAiIGhlaWdodD0iMTIyOC44MCIgcng9IjYxNC40IiBmaWxsPSIjZjVmNWY1IiBzdHJva2V3aWR0aD0iMCIvPgoNPC9nPgoNPGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iMzYuODY0Ij4KDTxwYXRoIGQ9Ik0xMjggODAwYTM4NCAxMzguNjY2NjY3IDAgMSAwIDc2OCAwIDM4NCAxMzguNjY2NjY3IDAgMSAwLTc2OCAwWiIgZmlsbD0iIzAwYjRjYyIvPgoNPHBhdGggZD0iTTUxMiAyNTZjLTQ3LjA2MTMzMyAwLTg1LjMzMzMzMy0zOC4yNzItODUuMzMzMzMzLTg1LjMzMzMzM3MzOC4yNzItODUuMzMzMzMzIDg1LjMzMzMzMy04NS4zMzMzMzQgODUuMzMzMzMzIDM4LjI3MiA4NS4zMzMzMzMgODUuMzMzMzM0LTM4LjI3MiA4NS4zMzMzMzMtODUuMzMzMzMzIDg1LjMzMzMzMyIgZmlsbD0iI0ZGQjc0RCIvPgoNPHBhdGggZD0iTTM2Mi42NjY2NjcgNDQ4djEwNi42NjY2NjdsNTYgMzcuMzMzMzMzTDQzNy4zMzMzMzMgODMyaDE0OS4zMzMzMzRsMTguNjY2NjY2LTI0MEw2NjEuMzMzMzMzIDU1NC42NjY2Njd2LTEwNi42NjY2NjdhMTQ5LjMzMzMzMyAxNDkuMzMzMzMzIDAgMCAwLTI5OC42NjY2NjYgMCIgZmlsbD0iIzQ1NUE2NCIvPgoNPC9nPgoNPGcgaWQ9IlNWR1JlcG9faWNvbkNhcnJpZXIiPgoNPHBhdGggZD0iTTEyOCA4MDBhMzg0IDEzOC42NjY2NjcgMCAxIDAgNzY4IDAgMzg0IDEzOC42NjY2NjcgMCAxIDAtNzY4IDBaIiBmaWxsPSIjMDBiNGNjIi8+Cg08cGF0aCBkPSJNNTEyIDI1NmMtNDcuMDYxMzMzIDAtODUuMzMzMzMzLTM4LjI3Mi04NS4zMzMzMzMtODUuMzMzMzMzczM4LjI3Mi04NS4zMzMzMzMgODUuMzMzMzMzLTg1LjMzMzMzNCA4NS4zMzMzMzMgMzguMjcyIDg1LjMzMzMzMyA4NS4zMzMzMzQtMzguMjcyIDg1LjMzMzMzMy04NS4zMzMzMzMgODUuMzMzMzMzIiBmaWxsPSIjRkZCNzREIi8+Cg08cGF0aCBkPSJNMzYyLjY2NjY2NyA0NDh2MTA2LjY2NjY2N2w1NiAzNy4zMzMzMzNMNDM3LjMzMzMzMyA4MzJoMTQ5LjMzMzMzNGwxOC42NjY2NjYtMjQwTDY2MS4zMzMzMzMgNTU0LjY2NjY2N3YtMTA2LjY2NjY2N2ExNDkuMzMzMzMzIDE0OS4zMzMzMzMgMCAwIDAtMjk4LjY2NjY2NiAwIiBmaWxsPSIjNDU1QTY0Ii8+Cg08L2c+Cg08L3N2Zz4=';
            var svg_arrow = 'PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iNTBweCIgaGVpZ2h0PSI1MHB4IiB2aWV3Qm94PSItMjUuNiAtMjUuNiAzMDcuMjAgMzA3LjIwIiBpZD0iRmxhdCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMTUuMTA0IiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiPgo8ZyBpZD0iU1ZHUmVwb19iZ0NhcnJpZXIiIHN0cm9rZS13aWR0aD0iMCI+CjxyZWN0IHg9Ii0yNS42IiB5PSItMjUuNiIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTUzLjYiIGZpbGw9IiNlZGVkZWQiIHN0cm9rZXdpZHRoPSIwIi8+CjwvZz4KPGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iNDMuMDA3OTk5OTk5OTk5OTk2Ij4gPHBhdGggZD0iTTEwMy41NCwyMjYuMjUxYTExLjgxOTI5LDExLjgxOTI5LDAsMCwxLTExLjMyNTItOC4wNzQyMkwzMy42MTAzNSw0OC44NzMwNUExMi4wMDAyMSwxMi4wMDAyMSwwLDAsMSw0OC44NzYsMzMuNjA3NDJMMjE4LjE3ODcxLDkyLjIxMjg5YTEyLjAwMDI3LDEyLjAwMDI3LDAsMCwxLS4zOTU1MSwyMi44MDk1N2wtNzYuNTU1NjYsMjMuNTU1NjZhMy45OTMsMy45OTMsMCwwLDAtMi42NDc0NiwyLjY0NjQ5bC0yMy41NTU2Nyw3Ni41NTU2NmExMS44MjUzMywxMS44MjUzMywwLDAsMS0xMS4yNjA3NCw4LjQ2ODc1QzEwMy42ODk0NSwyMjYuMjUsMTAzLjYxNDI2LDIyNi4yNTEsMTAzLjU0LDIyNi4yNTFaTTQ0LjkxNiw0MC45Mzc1YTQuMDEzNzEsNC4wMTM3MSwwLDAsMC0zLjc0NTEyLDUuMzE4MzZoMEw5OS43NzUzOSwyMTUuNTU5NTdhMy45OTk5MywzLjk5OTkzLDAsMCwwLDcuNjAyNTQtLjEzMTg0bDIzLjU1NTY2LTc2LjU1NjY0YTExLjk4ODcsMTEuOTg4NywwLDAsMSw3Ljk0MjM5LTcuOTM5NDVMMjE1LjQyOTY5LDEwNy4zNzZhMy45OTk1LDMuOTk5NSwwLDAsMCwuMTMxODMtNy42MDI1NEw0Ni4yNTg3OSw0MS4xNjhBNC4wNzk0OSw0LjA3OTQ5LDAsMCwwLDQ0LjkxNiw0MC45Mzc1WiIvPiA8L2c+CjxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTEwMy41NCwyMjYuMjUxYTExLjgxOTI5LDExLjgxOTI5LDAsMCwxLTExLjMyNTItOC4wNzQyMkwzMy42MTAzNSw0OC44NzMwNUExMi4wMDAyMSwxMi4wMDAyMSwwLDAsMSw0OC44NzYsMzMuNjA3NDJMMjE4LjE3ODcxLDkyLjIxMjg5YTEyLjAwMDI3LDEyLjAwMDI3LDAsMCwxLS4zOTU1MSwyMi44MDk1N2wtNzYuNTU1NjYsMjMuNTU1NjZhMy45OTMsMy45OTMsMCwwLDAtMi42NDc0NiwyLjY0NjQ5bC0yMy41NTU2Nyw3Ni41NTU2NmExMS44MjUzMywxMS44MjUzMywwLDAsMS0xMS4yNjA3NCw4LjQ2ODc1QzEwMy42ODk0NSwyMjYuMjUsMTAzLjYxNDI2LDIyNi4yNTEsMTAzLjU0LDIyNi4yNTFaTTQ0LjkxNiw0MC45Mzc1YTQuMDEzNzEsNC4wMTM3MSwwLDAsMC0zLjc0NTEyLDUuMzE4MzZoMEw5OS43NzUzOSwyMTUuNTU5NTdhMy45OTk5MywzLjk5OTkzLDAsMCwwLDcuNjAyNTQtLjEzMTg0bDIzLjU1NTY2LTc2LjU1NjY0YTExLjk4ODcsMTEuOTg4NywwLDAsMSw3Ljk0MjM5LTcuOTM5NDVMMjE1LjQyOTY5LDEwNy4zNzZhMy45OTk1LDMuOTk5NSwwLDAsMCwuMTMxODMtNy42MDI1NEw0Ni4yNTg3OSw0MS4xNjhBNC4wNzk0OSw0LjA3OTQ5LDAsMCwwLDQ0LjkxNiw0MC45Mzc1WiIvPiA8L2c+DTwvc3ZnPg==';
            const style = new lizMap.ol.style.Style({
                image: new lizMap.ol.style.Icon({
                    opacity: 1,
                    src: 'data:image/svg+xml;base64,' + svg_roamer,
                    scale: 1,
                    rotation: 0
                })
            });
            const style_rot = new lizMap.ol.style.Style({
                image: new lizMap.ol.style.Icon({
                    opacity: 1,
                    src: 'data:image/svg+xml;base64,' + svg_arrow,
                    scale: 0.5,
                    rotateWithView: true,
                    displacement: [ 0,-30 ],
                    rotation: this._rotation
                })
            });

            /* const style_triangle = new lizMap.ol.style.Style({
                image: new lizMap.ol.style.RegularShape({
                    fill: new lizMap.ol.style.Fill({
                        color: this._drawColor,
                    }),
                    points: 3,
                    rotation: this._rotation,
                    angle: 0,
                    radius: this._pointRadius,
                }); */
            return [style, style_rot];
        };
        return drawStyleFunction;
    }
}

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

    var mainLizmap = lizMap.mainLizmap;

    var html = '<div id="gsv-pano"></div>';

    lizMap.addDock(
        'gsv',
        'Street view',
        'minidock',
        html,
        'icon-road'
    );

    var gsv_panorama = new google.maps.StreetViewPanorama(
        document.getElementById('gsv-pano'), {
            position: {lat: 48, lng: 0},
            visible: false
        });

    var lsv = new LizGoogleStreeView(mainLizmap, gsv_panorama);

    lizMap.events.on({
        minidockopened: function(e) {
            if ( e.id == 'gsv' ) {
                // gsv is displayed in an absolute position, and set its width/height
                // regarding the width/height of its host (gsv-pano). So we must
                // set width/height of gsv-pano manually. These values depends
                // of the width/height of screen.
                var height, width;
                var mapStyles = window.getComputedStyle(document.getElementById('newOlMap'));
                var sidemenuStyles = window.getComputedStyle(document.getElementById('mapmenu'))
                var minidockStyles = window.getComputedStyle(document.getElementById('mini-dock'));
                if (document.getElementById('header') == null) {
                    height = (parseFloat(mapStyles.height) * 45 / 100) - 15;
                    width = ((parseFloat(mapStyles.width)-parseFloat(sidemenuStyles.width))  *  (parseFloat(minidockStyles.maxWidth)-1) / 100) -15;
                }
                else if (window.getComputedStyle(document.getElementById('header')).display == 'none') {
                    // we are in the iframe mode. No header displayed
                    height = (parseFloat(mapStyles.height) * 45 / 100) - 15;
                    width = document.getElementById('mini-dock').getBoundingClientRect().width - 20 ;
                }
                else {
                    var headerStyles = window.getComputedStyle(document.getElementById('header'));
                    // we are in the normal mode
                    height = (parseFloat(sidemenuStyles.height) * 45 / 100) - 15;
                    width = ((parseFloat(headerStyles.width)-parseFloat(sidemenuStyles.width))  *  (parseFloat(minidockStyles.maxWidth)-1) / 100) -15;
                }

                var gsvPano = document.getElementById('gsv-pano');
                gsvPano.style.width = width+'px';
                gsvPano.style.height = height+'px';

                lsv.activateStreetView();
                addGsvMessage( 'Click the map to start initialise Google Street View.');
            }
        },
        minidockclosed: function(e) {
            if ( e.id == 'gsv' ) {
                lsv.deactivateStreetView();
            }
        }
    });
}
