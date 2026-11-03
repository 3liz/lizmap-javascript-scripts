/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

// A toggle button enables a "buffer mode". While active, each click on the
// map draws a circle of a fixed radius centered on the clicked point
// (replacing the previous one). Purely visual, nothing is sent to the
// server or saved anywhere.
//
// Unlike library/tools/point_buffer_on_map (buffer centered on the map
// canvas, following it on pan), this one lets the user pick the center by
// clicking anywhere on the map. Handy for a quick on-screen check such as
// "is this parcel within 50 m of that boundary?".
//
// Assumes a metric CRS (the radius is used directly as map units / metres).
// For a geographic CRS (degrees), reproject first.

const RADIUS_MAP_UNITS = 50;
const STROKE_COLOR = 'red';
const FILL_COLOR = 'rgba(255, 0, 0, 0.1)';

lizMap.events.on({
    'uicreated': function () {
        const map = lizMap.mainLizmap.map;

        let active = false;
        let clickListener = null;
        // Initial value of lizMap.mainLizmap.popup.active, captured once,
        // to restore the exact previous state rather than hard-forcing
        // `true` when leaving buffer mode.
        let popupWasActive = !!(lizMap.mainLizmap.popup && lizMap.mainLizmap.popup.active);

        const bufferSource = new lizMap.ol.source.Vector();
        const bufferLayer = new lizMap.ol.layer.Vector({
            source: bufferSource,
            style: new lizMap.ol.style.Style({
                stroke: new lizMap.ol.style.Stroke({
                    color: STROKE_COLOR,
                    width: 2,
                    lineDash: [8, 6],
                }),
                fill: new lizMap.ol.style.Fill({
                    color: FILL_COLOR,
                }),
            }),
        });
        map.addLayer(bufferLayer);

        function drawBuffer(coordinate) {
            // clear() then re-add: only one circle shown at a time.
            bufferSource.clear();
            const circle = new lizMap.ol.geom.Circle(coordinate, RADIUS_MAP_UNITS);
            bufferSource.addFeature(new lizMap.ol.Feature({ geometry: circle }));
        }

        function onMapClick(evt) {
            drawBuffer(evt.coordinate);
        }

        function setButtonState(button, isActive) {
            button.innerHTML = isActive
                ? `Disable ${RADIUS_MAP_UNITS} m buffer`
                : `Enable ${RADIUS_MAP_UNITS} m buffer`;
        }

        function activate(button) {
            if (active) {
                return;
            }
            active = true;
            setButtonState(button, true);
            // Suspend native feature identification (click popup) while
            // buffer mode is active.
            if (lizMap.mainLizmap.popup) {
                popupWasActive = !!lizMap.mainLizmap.popup.active;
                lizMap.mainLizmap.popup.active = false;
            }
            clickListener = onMapClick;
            map.on('click', clickListener);
        }

        function deactivate(button) {
            if (!active) {
                return;
            }
            active = false;
            setButtonState(button, false);
            if (clickListener) {
                map.un('click', clickListener);
                clickListener = null;
            }
            // Restore native identification exactly as it was before
            // buffer mode was activated.
            if (lizMap.mainLizmap.popup) {
                lizMap.mainLizmap.popup.active = popupWasActive;
            }
        }

        const button = document.createElement('button');
        button.className = 'btn btn-primary btn-lg';
        button.style.position = 'absolute';
        button.style.top = '30px';
        button.style.zIndex = '1000';
        button.style.marginLeft = 'calc(20% - 80px)';
        setButtonState(button, false);
        document.getElementById('map-content').appendChild(button);

        button.addEventListener('click', function () {
            if (active) {
                deactivate(button);
            } else {
                activate(button);
            }
        });

        document.addEventListener('keydown', function (evt) {
            if (evt.key === 'Escape' && active) {
                deactivate(button);
            }
        });
    },
});
