const URL = 'https://your-url.fr/index.php/lizmap/service/?repository=your-repo&project=your-project&SERVICE=WFS&REQUEST=GetFeature&VERSION=1.0.0&TYPENAME=your-layer-name&OUTPUTFORMAT=GeoJSON';

// You can add tooltip for multiple layer
const layersURL = [URL];
// You also need to provide the layer name
const layersNames = ['Name of your layer'];

// Function to retrieve data
async function getDataTooltip(url) {
    try {
        const response = await fetch(url); 

        if (!response.ok) {
            throw new Error(`HTTP Error! Statut : ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
       console.error('An error occurred while fetching the data.', error);
       throw error; 
   }
};

function createPoint(lon, lat) {
    var lonLat = new OpenLayers.LonLat(lon, lat).transform(
        new OpenLayers.Projection("EPSG:4326"),
        new OpenLayers.Projection("EPSG:3857")
    );

    var pointGeom = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
    const feature = new OpenLayers.Feature.Vector(pointGeom);

    return feature;
}

// Creation of the tooltip
function createSelectControl(vectorLayer, popupName) {
    var map = lizMap.map;

    // Create Control
    var selectControl = new OpenLayers.Control.SelectFeature(vectorLayer, {
        hover: true,
        onSelect: function(feature) {
            // Get data from entity
            var info = "";

            for (var key in feature.attributes) {
                info += "<strong style='font-weight:bold;'>" + key + ":</strong> " + feature.attributes[key] + "<br/>";
            }

            // Show the data from the tooltip
            feature.popup = new OpenLayers.Popup("popup_" + popupName,
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(180, 180),
                info,
                false
            );

            feature.popup.contentDiv.style.fontSize = "9px";
            feature.popup.contentDiv.style.color = "black";
            feature.popup.contentDiv.style.border = "1px solid black";
            feature.popup.contentDiv.style.padding = "5px";

            map.addPopup(feature.popup);
        },
        onUnselect: function(feature) {
            // Delete tooltip
            if (feature.popup) {
                map.removePopup(feature.popup);
                feature.popup.destroy();
                delete feature.popup;
            }
        }
    });

    return selectControl;
}

function addCheckboxClickListener(layerName) {
    // add an Event Listener when the layer is checked
    $('#layer-' + layerName + ' button.btn.checkbox').click(function() {
        var isChecked = $(this).hasClass('checked');
        toggleSelectControl(layerName, isChecked);
    });

    var className = $('#layer-' + layerName)[0].className;

    // Add the same behaviour if the button of the group is checked
    if (className.includes('child-of-group')){
        var idGroup = className.match(/child-of-(\S+)\s/)[1];

        $('#' + idGroup + ' button.btn.checkbox').click(function() {
            var isChecked = $(this).hasClass('checked');
            toggleSelectControl(layerName, isChecked);
        });

    }
}

function toggleSelectControl(layerName, isEnabled) {
    var selectControl = getSelectControl(layerName + '_tooltip');

    if (selectControl) {
        if (isEnabled) {
            selectControl.activate();
        } else {
            selectControl.deactivate();
        }
    }
}

function getSelectControl(layerName) {
    var map = lizMap.map;
    var layers = map.getLayersByName(layerName);

    if (layers.length > 0) {
        var layer = layers[0];

        var controls = layer.map.controls;

        for (var control of controls) {
            if ((control.CLASS_NAME === "OpenLayers.Control.SelectFeature") && (control.layer.name === layerName)) {
                return control;
            }
        }
    }
    return null;
}

lizMap.events.on({
    'uicreated' : function(_) {
        const map = lizMap.map;
        
        // The layer is invisible. You can change the pointRadius of the layer 
        const iconStyle = new OpenLayers.Style({
            pointRadius: 7,
            fillColor: '#ff0000',
            fillOpacity: 0,
            strokeWidth: 0,
            strokeOpacity:0
        });
        
        $.each(layersURL, function(index, url){
            const promise = getDataTooltip(url);

            promise.then(data =>{
                // Creation of the tooltip layer
                const vectorLayer = new OpenLayers.Layer.Vector(layersNames[index] + '_tooltip', {
                    styleMap: iconStyle
                });

                $.each(data.features, function(_, featureData){
                    lon = featureData.geometry.coordinates[0];
                    lat = featureData.geometry.coordinates[1];

                    feature = createPoint(lon, lat, 'EPSG:4326');
                    feature.attributes = featureData.properties;

                    vectorLayer.addFeatures(feature);
                })

                // Create the control for the layer
                var selectControl = createSelectControl(vectorLayer, layersNames[index] + '_tooltip');

                map.addLayer(vectorLayer);
                map.addControl(selectControl);
                selectControl.deactivate();
            })

            // Add an Event Listener when the original layer is visible on the map
            addCheckboxClickListener(layersNames[index]);    
        })       
    }
});
