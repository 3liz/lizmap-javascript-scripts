var workerXY = new Worker('https://your-app/index.php/view/media/getMedia?repository=your-repo&project=your-project&path=media%2Fjs%2Fdefault%2FworkerXY.js');

function startReadingXY(promises) {
    Promise.all(promises)
        .then(dataJson => {
            workerXY.postMessage({ dataJson });
        })
        .catch(error => {
            console.error(error);
        });
}

// Ecoute du message provenant du web worker
workerXY.onmessage = function(event) {
    const { dataJson } = event.data;
    const colLon = $('#selectLongitude').val();
    const colLat = $('#selectLatitude').val();

    if (dataJson.length > 0) {
        var map = lizMap.map;

        iconStyle = createIconStyle($('#selectLogo').val());

        layerXY = new OpenLayers.Layer.Vector('LayerGPS', {
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

        workerXY.terminate();

    } else {
        alert("No data to map");
    }
}
