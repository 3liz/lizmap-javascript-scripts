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
            const customStrokeColor = '#0000ff';
            const customSymbolizer = {
                "Point": {
                    pointRadius: 4,
                    graphicName: "square",
                    fillColor: "white",
                    fillOpacity: 1,
                    strokeWidth: 1,
                    strokeOpacity: 1,
                    strokeColor: customStrokeColor
                },
                "Line": {
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    strokeColor: customStrokeColor,
                    strokeDashstyle: "dash"
                },
                "Polygon": {
                    strokeWidth: 2,
                    strokeOpacity: 1,
                    strokeColor: customStrokeColor,
                    strokeDashstyle: "dash",
                    fillColor: "white",
                    fillOpacity: 0.3
                }
            };

            for (const measureControl of lizMap.map.getControlsByClass('OpenLayers.Control.Measure')) {
                measureControl.handlerOptions.layerOptions.styleMap.styles.default.rules[0].symbolizer = customSymbolizer;
            }
        }
    }
});
