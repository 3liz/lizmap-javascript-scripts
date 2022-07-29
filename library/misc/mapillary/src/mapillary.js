import MVT from 'ol/format/MVT';
import { VectorTile as VectorTileLayer, Vector as VectorLayer } from 'ol/layer';
import { VectorTile as VectorTileSource, Vector as VectorSource } from 'ol/source';
import { Icon, Style } from 'ol/style';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { transform } from 'ol/proj';
import { containsCoordinate } from 'ol/extent';

import { Viewer } from 'mapillary-js';

lizMap.events.on({

    uicreated: () => {

        lizMap.addDock("Mapillary", "Mapillary", "minidock", `<div id="mapillary-view" style="width:100%;min-width:400px;height:350px"></div>`, "mapillary-icon");

        // Load CSS
        $("head").append('<link href="https://unpkg.com/mapillary-js@4.1.0/dist/mapillary.css" rel="stylesheet"/>');
        $("head").append(`
        <style type="text/css">
            .Mapillary .mapillary-icon {
                width:16px;
                height:16px;
                background-position: center;
                background-image: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' height='24' width='24' version='1.1'%3E%3Cpath d='M0,0 h100 v100 h-100z' fill='transparent'/%3E%3Cpath d='M42.71,66.19A2.5,2.5 0,0,1 39.32,67.2L5.08,48.69A2.5,2.5 0,0,1 5.48,44.12L33.27,34.85A2.5,2.5 0,0,0 34.85,33.27L44.12,5.48A2.5,2.5 0,0,1 48.69,5.08L67.2,39.32A2.5,2.5 0,0,1 66.19,42.71L61.79,45.09A2.5,2.5 0,0,1 58.4,44.08L50.88,30.15A2.5,2.5 0,0,0 46.3,30.55L42.76,41.18A2.5,2.5 0,0,1 41.18,42.76L30.55,46.3A2.5,2.5 0,0,0 30.15,50.88L44.08,58.4A2.5,2.5 0,0,1 45.09,61.79zM68.33,46.67A2.5,2.5 0,0,1 71.72,47.68L96.01,92.63A2.5,2.5 0,0,1 92.63,96.01L47.68,71.72A2.5,2.5 0,0,1 46.67,68.33L49.05,63.93A2.5,2.5 0,0,1 52.43,62.92L67.89,71.27A2.5,2.5 0,0,0 71.27,67.89L62.92,52.43A2.5,2.5 0,0,1 63.93,49.05z' fill='%23fff' transform='scale(.79) translate(10.5,10.5)'/%3E%3C/svg%3E%0A");
            }
            .nav .Mapillary.active .mapillary-icon, .nav .Mapillary a:hover .mapillary-icon {
                background-image: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' height='24' width='24' version='1.1'%3E%3Cpath d='M0,0 h100 v100 h-100z' fill='transparent'/%3E%3Cpath d='M42.71,66.19A2.5,2.5 0,0,1 39.32,67.2L5.08,48.69A2.5,2.5 0,0,1 5.48,44.12L33.27,34.85A2.5,2.5 0,0,0 34.85,33.27L44.12,5.48A2.5,2.5 0,0,1 48.69,5.08L67.2,39.32A2.5,2.5 0,0,1 66.19,42.71L61.79,45.09A2.5,2.5 0,0,1 58.4,44.08L50.88,30.15A2.5,2.5 0,0,0 46.3,30.55L42.76,41.18A2.5,2.5 0,0,1 41.18,42.76L30.55,46.3A2.5,2.5 0,0,0 30.15,50.88L44.08,58.4A2.5,2.5 0,0,1 45.09,61.79zM68.33,46.67A2.5,2.5 0,0,1 71.72,47.68L96.01,92.63A2.5,2.5 0,0,1 92.63,96.01L47.68,71.72A2.5,2.5 0,0,1 46.67,68.33L49.05,63.93A2.5,2.5 0,0,1 52.43,62.92L67.89,71.27A2.5,2.5 0,0,0 71.27,67.89L62.92,52.43A2.5,2.5 0,0,1 63.93,49.05z' fill='%23000' transform='scale(.79) translate(10.5,10.5)'/%3E%3C/svg%3E%0A");
            }
        </style>`);

    },
    minidockopened: e => {
        if (e.id === 'Mapillary') {
            // Put OL6 map on top
            lizMap.mainLizmap.newOlMap = true;

            let init = true;

            // Display Mapillary layers if they exist else init
            for (const layer of lizMap.mainLizmap.map.getLayers().getArray()) {
                if (layer.get('title').startsWith('mapillary')) {
                    layer.setVisible(true);
                    init = false;
                }
            }

            if (!init) {
                return;
            }

            // Init

            // Mapillary must be set in mapillary_token.js
            const token = window.MAPILLARY_TOKEN;

            const mapillaryVTSource = new VectorTileSource({
                format: new MVT(),
                maxZoom: 14,
                url: 'https://tiles.mapillary.com/maps/vtp/mly1_computed_public/2/{z}/{x}/{y}?access_token=' + token,
            });

            const mapillaryVT = new VectorTileLayer({
                title: 'mapillary-vt',
                source: mapillaryVTSource
            });

            lizMap.mainLizmap.map.addLayer(mapillaryVT);

            const svgArrow = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><path d="M48.005 2.666a2.386 2.386 0 0 0-.51.397 2.386 2.386 0 0 0-.531.844l-33.169 90.76a2.386 2.386 0 0 0 3.52 2.836l32.08-20.345 32.186 20.177a2.386 2.386 0 0 0 3.506-2.854L51.442 3.894a2.386 2.386 0 0 0-3.437-1.228Z" style="color:#000;font-style:normal;font-variant:normal;font-weight:400;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000;solid-opacity:1;vector-effect:none;fill:navy;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:4.77229;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000"/></svg>';

            // Draw layer
            const drawSource = new VectorSource();
            const drawLayer = new VectorLayer({
                title: 'mapillary-pov',
                source: drawSource,
                style: new Style({
                    image: new Icon({
                        src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgArrow),
                        scale: 0.3
                    })
                }),
            });

            lizMap.mainLizmap.map.addLayer(drawLayer);

            const viewer = new Viewer({
                accessToken: token,
                container: 'mapillary-view',
            });

            viewer.on('pov', async (evt) => {
                const pov = await evt.target.getPointOfView();
                drawLayer.getStyle().getImage().setRotation(pov.bearing * Math.PI / 180);
                drawLayer.changed();
            });

            viewer.on('position', async () => {
                const position = await viewer.getPosition();

                const coords = transform([position.lng, position.lat], 'EPSG:4326', lizMap.mainLizmap.projection);

                drawSource.getFeatures()[0].getGeometry().setCoordinates(coords);

                // Center map when point is close to leave the map
                const mapRatio = 0.9;
                const mapSize = lizMap.mainLizmap.map.getSize();
                const smallerMapSize = [mapSize[0] * mapRatio, mapSize[1] * mapRatio];

                const smallerExtent = lizMap.mainLizmap.map.getView().calculateExtent(smallerMapSize);

                if (!containsCoordinate(smallerExtent, coords)) {
                    lizMap.mainLizmap.map.getView().setCenter(coords);
                }
            });

            lizMap.mainLizmap.map.on('singleclick', evt => {
                const features = lizMap.mainLizmap.map.getFeaturesAtPixel(evt.pixel);

                // Get `image_id` for layer "sequence" or `id` for layer "overview" or "image"
                const imageId = features?.[0]?.getProperties()?.image_id || features?.[0]?.getProperties()?.id;

                if (imageId) {
                    const oldFeature = drawSource.getFeatures()?.[0];
                    if (oldFeature) {
                        drawSource.removeFeature(oldFeature);
                    }

                    drawSource.addFeature(new Feature({
                        geometry: new Point(features[0].getFlatCoordinates())
                    }));

                    viewer.moveTo(imageId);
                    viewer.deactivateCover();
                }
            });
        }
    },
    minidockclosed: e => {
        if (e.id === 'Mapillary') {
            // Put back OL6 map at bottom
            lizMap.mainLizmap.newOlMap = false;

            // Hide Mapillary vector tile
            for (const layer of lizMap.mainLizmap.map.getLayers().getArray()) {
                if (layer.get('title').startsWith('mapillary')) {
                    layer.setVisible(false);
                }
            }
        }
    }
});
