/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
    minidockopened : e => {        
        if(e.id === "measure"){
            // Define the stroke color for all measure tools in `customStrokeColor`
            // or you are free to set style rules individually in `customSymbolizer`
            const sketchSymbolizers = {
                "Point": {
                    pointRadius: 4,
                    graphicName: "square",
                    fillColor: "white",
                    fillOpacity: 1,
                    strokeWidth: 1,
                    strokeOpacity: 1,
                    strokeColor: "#333333"
                },
                "Line": {
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    strokeColor: "white",
                    strokeDashstyle: "dot"
                },
                "Polygon": {
                    strokeWidth: 2,
                    strokeOpacity: 1,
                    strokeColor: "white",
                    strokeDashstyle: "solid",
                    fillColor: "white",
                    fillOpacity: 0.3
                }
            };

            for (const measureControl of lizMap.map.getControlsByClass('OpenLayers.Control.Measure')) {
                measureControl.handlerOptions.layerOptions.styleMap.styles.default.rules[0].symbolizer = sketchSymbolizers;
            }
        }
    }
});
