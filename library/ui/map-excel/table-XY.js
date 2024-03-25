function startReadingXY(promises, colLon, colLat) {
    Promise.all(promises)
        .then(dataJson => {
            if (dataJson.length > 0) {
                var map = lizMap.map;

                iconStyle = createIconStyle($('#selectLogo').val());

                layerXY = new OpenLayers.Layer.Vector('CoucheGPS', {
                    styleMap: iconStyle
                });

                map.addLayer(layerXY);

                dataJson.forEach(table => {
                    table.forEach(rowData => {
                        var lon = parseFloat(rowData[colLon]);
                        var lat = parseFloat(rowData[colLat]);

                        feature = createPoint(lon, lat, 'EPSG:4326');

                        feature.attributes = rowData;
                        layerXY.addFeatures(feature);

                        layerXY.events.on({
                            'featureselected': function (event) {
                                var feature = event.feature;
                                var content = createPopupContent(feature.attributes);
                                var popup = new OpenLayers.Popup.FramedCloud(
                                    'popup',
                                    feature.geometry.getBounds().getCenterLonLat(),
                                    null,
                                    content,
                                    null,
                                    true,
                                    null
                                );
                                map.addPopup(popup);
                            }
                        });
                    })
                })

            } else {
                alert("Pas de données à cartographier");
            }
        }).catch(error => {
            alert("Erreur");
            console.log(error);
        });
}
