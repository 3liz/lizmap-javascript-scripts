/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

var map_crs = "EPSG:3857"
var local_crs = "EPSG:2154"  // 3857 is very bad for doing a buffer in meters, so better to use a local projection
var radius = 1000; // in local crs unit
var text_add = 'Add a 1 km buffer'
var text_remove = 'Remove the buffer'

lizMap.events.on({
    'uicreated':function(evt){

        lizMap.map.addLayer(new OpenLayers.Layer.Vector('buffer_dynamic',{
            styleMap: new OpenLayers.StyleMap({
                pointRadius: 5,
                fill: true,
                fillOpacity: 0.2,
                stroke: true,
                strokeWidth: 3,
                strokeColor: 'red',
                strokeOpacity: 0.5
            })
        }));
        var bufferDynamic = lizMap.map.getLayersByName('buffer_dynamic')[0];

        var html = '<button id="bufferButton" class="btn btn-primary btn-lg">' + text_add + '</button>';
        $('#map-content').append(html);
        $('#bufferButton')
           .css('position', 'absolute')
           .css('top', '30px')
           .css('z-index', '1000')
           .css('margin-left', 'calc(50% - 80px)');

        lizMap.map.events.register('moveend', this, function() {
            if( $('#bufferButton').text() == text_remove ){
                drawBuffer();
            }
        });

        function drawBuffer() {
            bufferDynamic.removeAllFeatures();
            point = lizMap.map.center;
            var center_point = new OpenLayers.Geometry.Point(point.lon, point.lat);
            center_point.transform(map_crs, local_crs);
            var circle = OpenLayers.Geometry.Polygon.createRegularPolygon(center_point, radius, 30);
            circle.transform(local_crs, map_crs)
            var circleFeature = new OpenLayers.Feature.Vector(circle);
            center_point.transform(local_crs, map_crs);
            var pointFeature = new OpenLayers.Feature.Vector(center_point);
            bufferDynamic.addFeatures([circleFeature, pointFeature]);
        }

        $('#bufferButton').click(function(){
            if( $(this).text() == text_add ){
                drawBuffer();
                $(this).text(text_remove);
            } else {
                bufferDynamic.removeAllFeatures();
                $(this).text(text_add);
            }
        });
    }
});
