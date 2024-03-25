function createPopup(feature) {
    var lon = feature.geometry.x;
    var lat = feature.geometry.y;
    var popupContent = createPopupContent(feature.attributes);

    var $popup = $('<div>')
        .attr('id', 'popup')
        .addClass('popup')
        .html(popupContent)
        .hide()
        .appendTo('body');

    // Positionnement du popup
    var left = lon;
    var top = lat;
    $popup.css({
        left: left + 'px',
        top: top + 'px'
    }).fadeIn();

    // Fermeture du popup lors du clic en dehors du popup
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#popup').length) {
            $popup.fadeOut();
        }
    });

    return $popup;
}

function createPopupContent(attributes) {
    var content = '<div style="font-size: 12px;">';
    $.each(attributes, function (key, value) {
        content += '<b>' + key + ':</b> ' + value + '<br>';
    });
    content += '</div>';
    return content;
}

function createPoint(lon, lat) {
    var lonLat = new OpenLayers.LonLat(lon, lat).transform(
        new OpenLayers.Projection("EPSG:4326"),
        new OpenLayers.Projection("EPSG:3857")
    );

    var pointGeom = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
    const feature = new OpenLayers.Feature.Vector(pointGeom);

    return feature;
}

function createIconStyle(imageUrl) {
    const iconStyle = new OpenLayers.StyleMap({
        externalGraphic: imageUrl,
        graphicWidth: 20, 
        graphicHeight: 25, 
        graphicOpacity: 1,
        graphicName: 'circle',
        fillOpacity: 0.8,
        stroke: true,
        strokeWidth: 1,
        strokeColor: 'black',
        strokeOpacity: 0.5,
    });
    return iconStyle;
}
