// Buffer Radius & Projection definitions
const radius = 10000; // Buffer radius in meters
const textAdd = `Add a ${radius / 1000} km buffer`; // Dynamic text based on the radius
const textRemove = 'Remove the buffer';
const mapCrs = 'EPSG:3857'; // Used for display
const localCrs = 'EPSG:4326'; // Geographic coordinate system for accurate measurements (in degrees).

// Function to create the interaction button
function createButton() {
    const button = document.createElement('button');
    button.id = 'bufferButton';
    button.className = 'btn btn-primary btn-lg';
    button.innerHTML = textAdd;
    button.style.position = 'absolute';
    button.style.top = '30px';
    button.style.zIndex = '1000';
    button.style.marginLeft = 'calc(20% - 80px)';
    document.getElementById('map-content').appendChild(button);
    return button;
}

// Function to create an approximate circle as a polygon
function createCircularPolygon(center, radius, numSides = 64) {
    const points = [];
    const angleStep = (2 * Math.PI) / numSides;

    // Generate the circle points from the center
    for (let i = 0; i < numSides; i++) {
        const angle = i * angleStep;
        const dx = radius * Math.cos(angle); // X distance
        const dy = radius * Math.sin(angle); // Y distance

        // Convert distances to geographic coordinates
        const point = [
            center[0] + dx / (111320 * Math.cos(center[1] * (Math.PI / 180))), // Longitude adjustment
            center[1] + dy / 110540, // Latitude adjustment
        ];
        points.push(point);
    }
    points.push(points[0]); // Close the polygon

    return new lizMap.ol.geom.Polygon([points]);
}

// Function to draw the buffer, center point, and label
function drawBuffer(map, bufferLayer) {
    bufferLayer.getSource().clear();

    const center = map.getView().getCenter(); // Get the current map center

    // Transform the center coordinates to EPSG:4326 for accurate measurements
    const centerInLocalCrs = lizMap.ol.proj.transform(center, mapCrs, localCrs);

    // Create a circle polygon in EPSG:4326
    const circleInLocalCrs = createCircularPolygon(centerInLocalCrs, radius);

    // Transform the circle back to EPSG:3857 for display
    circleInLocalCrs.transform(localCrs, mapCrs);

    // Add the circle to the vector layer
    const circleFeature = new lizMap.ol.Feature(circleInLocalCrs);
    bufferLayer.getSource().addFeature(circleFeature);

    // Add a point at the center of the circle
    const centerPoint = new lizMap.ol.geom.Point(center); // Center in EPSG:3857
    const pointFeature = new lizMap.ol.Feature(centerPoint);
    bufferLayer.getSource().addFeature(pointFeature);

    // Add a label with the radius in km on the circle's perimeter
    const labelFeature = new lizMap.ol.Feature({
        geometry: new lizMap.ol.geom.Point(circleInLocalCrs.getCoordinates()[0][Math.floor(circleInLocalCrs.getCoordinates()[0].length / 4)]), // Place the label on the perimeter
        name: `${radius / 1000} km`, // Text for the label
    });
    bufferLayer.getSource().addFeature(labelFeature);
}

// Initialize after the user interface is created
lizMap.events.on({
    'uicreated': function(evt) {
        const map = lizMap.mainLizmap.map;

        // Create a vector layer to display the buffer
        const bufferLayer = new lizMap.ol.layer.Vector({
            source: new lizMap.ol.source.Vector(),
            style: function (feature) {
                // Apply different styles for points, circle, and label
                if (feature.get('name')) {
                    // Style for the label
                    return new lizMap.ol.style.Style({
                        text: new lizMap.ol.style.Text({
                            font: '10px Calibri,sans-serif',
                            text: feature.get('name'),
                            fill: new lizMap.ol.style.Fill({
                                color: 'black',
                            }),
                            stroke: new lizMap.ol.style.Stroke({
                                color: 'white',
                                width: 3,
                            }),
                        }),
                    });
                } else if (feature.getGeometry().getType() === 'Point') {
                    // Style for the central point
                    return new lizMap.ol.style.Style({
                        image: new lizMap.ol.style.Circle({
                            radius: 3,
                            fill: new lizMap.ol.style.Fill({
                                color: 'red',
                            }),
                            stroke: new lizMap.ol.style.Stroke({
                                color: 'red',
                                width: 1,
                            }),
                        }),
                    });
                } else {
                    // Style for the circle
                    return new lizMap.ol.style.Style({
                        stroke: new lizMap.ol.style.Stroke({
                            color: 'red',
                            width: 2,
                        }),
                        fill: new lizMap.ol.style.Fill({
                            color: 'rgba(255, 0, 0, 0.05)',
                        }),
                    });
                }
            },
        });
        map.addLayer(bufferLayer);

        // Create the button to toggle the buffer
        const bufferButton = createButton();

        // Handle button clicks
        bufferButton.addEventListener('click', function () {
            if (bufferButton.innerHTML === textAdd) {
                drawBuffer(map, bufferLayer); // Draw the buffer
                bufferButton.innerHTML = textRemove; // Change button text
            } else {
                bufferLayer.getSource().clear(); // Remove the buffer
                bufferButton.innerHTML = textAdd; // Reset button text
            }
        });

        // Redraw the buffer when the map is moved, if the buffer is active
        map.on('moveend', function () {
            if (bufferButton.innerHTML === textRemove) {
                drawBuffer(map, bufferLayer);
            }
        });
    }
});

