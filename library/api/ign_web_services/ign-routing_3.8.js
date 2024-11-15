const TAILLE_SYMBOLE = '15';
const COULEUR_ITINERAIRE = 'blue';
const COULEUR_POINT_DEPART = 'green';
const COULEUR_POINT_ARRIVEE = 'red';

class IgnRouting {

    constructor() {
        this.geocodingUrl = `https://data.geopf.fr/geocodage/search?`;
        this.geocodingUrl += 'index=address&limit=1&returntruegeometry=true&q=';
        this.reverseGeocodingUrl = `https://data.geopf.fr/geocodage/reverse?`;
        this.reverseGeocodingUrl += 'index=address&limit=1&';
        this.routingUrl = 'https://data.geopf.fr/navigation/itineraire?';

        this.routingPointLayer = null;
        this.routingRouteLayer = null;
        this.routeLayer = null;
    }

    /**
     * Geocode a given address
     * by using the IGN API
     *
     */
    async geocodeAddress(adresse) {

        // Ajout de l'adresse en paramètre
        let url = this.geocodingUrl + adresse;

        // Lance la requête et récupère la "promesse" de réponse
        // await permet d'attendre que la réponse soit reçue
        let response = await fetch(url);
        // On teste si la réponse est OK
        if (response.ok) { // if HTTP-status is 200-299
            // obtenir le corps de réponse en JSON
            let json = await response.json();

            return json;
        } else {
            // Réponse pas ok, on renvoie le code d'erreur HTTP
            console.log("An error occurred, status: " + response.status);
            let msgElt = document.getElementById('lizmap-ign-routing-message');
            if (msgElt) msgElt.remove();
            lizMap.addMessage(
                "Une erreur est survenue lors du géocodage de cette adresse", 'info', true, 3000
            ).attr('id', 'lizmap-ign-routing-message');

            return null;
        }
    }

    /**
     * Reverse geocoding based on a point
     * from the IGN API
     *
     */
    async reverseGeocodePoint(longitude, latitude) {
        // Add lon and lat
        let url = this.reverseGeocodingUrl + `lon=${longitude}&lat=${latitude}&`;
        url += `searchgeom={"type": "Circle", "coordinates": [${longitude}, ${latitude}], "radius": 400}`;

        // Lance la requête et récupère la "promesse" de réponse
        // await permet d'attendre que la réponse soit reçue
        let response = await fetch(url);
        // On teste si la réponse est OK
        if (response.ok) { // if HTTP-status is 200-299
            // obtenir le corps de réponse en JSON
            let json = await response.json();

            return json;
        } else {
            // Réponse pas ok, on renvoie le code d'erreur HTTP
            console.log("An error occurred, status: " + response.status);
            let msgElt = document.getElementById('lizmap-ign-routing-message');
            if (msgElt) msgElt.remove();
            lizMap.addMessage(
                "Une erreur est survenue lors de la recherche de l'adresse du point déplacé", 'info', true, 3000
            ).attr('id', 'lizmap-ign-routing-message');

            return null;
        }
    }

    /**
     * Routing requested to the IGN API
     *
     * @param {array} origin Coordinates of the start point
     * @param {array} destination Coordinates of the end point
     * @param {string} profile Profile : car or pedestrian
     */
    async getRoute(origin, destination, profile='car') {

        // Parameters
        let params = {
            resource: 'bdtopo-valhalla',
            profile: profile,
            optimization: 'fastest',
            geometryFormat: 'geojson',
            getSteps: 'false',
            getBbox: 'true',
            distanceUnit: 'kilometer',
            timeUnit: 'minute',
            crs: 'EPSG:4326'
        };
        params['start'] = `${origin[0]},${origin[1]}`;
        params['end'] = `${destination[0]},${destination[1]}`;

        // Build URL
        let urlParams = [];
        for (let prop in params) {
            urlParams.push(`${prop}=${params[prop]}`);
        }
        let url = this.routingUrl + urlParams.join('&');

        // Lance la requête et récupère la "promesse" de réponse
        // await permet d'attendre que la réponse soit reçue
        let response = await fetch(url);
        // On teste si la réponse est OK
        if (response.ok) { // if HTTP-status is 200-299
            // obtenir le corps de réponse en JSON
            let json = await response.json();

            return json;
        } else {
            // Réponse pas ok, on renvoie le code d'erreur HTTP
            console.log("An error occurred, status: " + response.status);
            let msgElt = document.getElementById('lizmap-ign-routing-message');
            if (msgElt) msgElt.remove();
            lizMap.addMessage(
                "Une erreur est survenue lors du calcul d'itinéraire. Vérifiez les points de départ et d'arrivée.", 'info', true, 3000
            ).attr('id', 'lizmap-ign-routing-message');

            return null;
        }
    }
}


/**
 * Create the HTML content to use in the dock to create
 */
function createRoutingDockHtml() {

    let html = `
    <style>
        table.ign_routing_table {
            width:100%;
            font-size: 11pt;
        }
        table.ign_routing_table td {
            vertical-align: center;
        }
    </style>
    <table class="ign_routing_table" border="0" cellpadding="2" cellspacing="1">
    	<tbody>
    		<tr>
    			<td width="20%">Départ</td>
    			<td><input id="ign_start_address" name="start" type="text" value="" placeholder="Adresse de départ"/></td>
    		</tr>
    		<tr>
    			<td width="20%">Arrivée</td>
    			<td><input id="ign_end_address" name="end" type="text" value="" placeholder="Adresse d'arrivée"/></td>
    		</tr>
    		<tr>
    			<td width="20%">Mode</td>
    			<td>
                    <select id="ign_routing_profile" name="profile"/>
                        <option selected="selected" value="car">Voiture</option>
                        <option value="pedestrian">Piéton</option>
                    </select>
                </td>
    		</tr>
    		<tr>
    			<td colspan="2">
                    <button id="ign_bind_geolocation" class="btn btn-small">Suivre la position</button>
                    <button id="ign_reinitialize" class="btn btn-small">Réinitialiser</button>
                </td>
    		</tr>
    	</tbody>
    </table>
    `;

    return html;

}

/**
 * Add a new dock inside Lizmap
 * containing the HMTL needed for the routing tolizMap.ol.
 */
function addRoutingDock() {

    // Récupère le HTML à afficher
    let html_panneau = createRoutingDockHtml();

    // Créer le menu du panneau pour notre outil
    lizMap.addDock(
        'ign_itineraire', // code du panneau (simple)
        'Calcul d\'itinéraire (IGN)', // nom affiché
        'minidock', // endroit: dock (gauche), minidock (petit à droite), rightdock, bottomdock
        html_panneau, // Contenu HTML pour remplir le panneau
        'icon-road' // Icône qui vient de https://getbootstrap.com/2.3.2/base-css.html#icons
    );
}


/**
 * Create the OpenLayers vector layers
 * that will be used to show the start & end points
 * and the route linestring.
 *
 * This method also add the needed controls (draw, drag)
 * and fake features.
 *
 */
function createRoutingMapLayers() {

    // Layer for the route linestring
    routingRouteLayer_source = new lizMap.ol.source.Vector({ wrapX: false });
    routingRouteLayer = new lizMap.ol.layer.Vector({
        source: routingRouteLayer_source,
        style: (feature) => {
            return [
                new lizMap.ol.style.Style({
                  stroke: new lizMap.ol.style.Stroke({
                    color: 'white',
                    width: 10
                  })
                }),
                new lizMap.ol.style.Style({
                  stroke: new lizMap.ol.style.Stroke({
                    color: COULEUR_ITINERAIRE,
                    width: 6
                  })
                })
            ]
        }
    });

    // Set layer name
    routingRouteLayer.set('name', 'ign-routing-route-layer')

    lizMap.mainLizmap.map.addToolLayer(routingRouteLayer);
    this.routingRouteLayer = routingRouteLayer

    // route
    const startPointCoordinates =  [0, 0];
    const endPointCoordinates =  [0, 0];

    routeFeature = new lizMap.ol.Feature(
        new lizMap.ol.geom.LineString([startPointCoordinates, endPointCoordinates]),
    );
    routeFeature.setProperties({'fid': 1, 'name': 'route'});
    routeFeature.setId(1);

    // Add the features
    routingRouteLayer.getSource().addFeatures([routeFeature]);

    // Layer for the start and end points
    routingPointLayer_source = new lizMap.ol.source.Vector({ wrapX: false });
    routingPointLayer = new lizMap.ol.layer.Vector({
        source: routingPointLayer_source,
        style: (feature) => {
            const featureName = feature.get('name');
            const featureIndex = feature.get('fid');
            let fillColor = 'white';
            let strokeColor = 'green';
            let strokeWidth = 5;
            let circleRadius = TAILLE_SYMBOLE;
            let labelText = '';

            // Start is green, end is red and intermediates are blue
            if (featureName === 'start') {
                strokeColor = COULEUR_POINT_DEPART;
                labelText = 'D';
            }
            if (featureName === 'end') {
                strokeColor = COULEUR_POINT_ARRIVEE;
                labelText = 'A';
            }
            return new lizMap.ol.style.Style({
                // Circle
                image: new lizMap.ol.style.Circle({
                    radius: circleRadius,
                    fill: new lizMap.ol.style.Fill({
                        color: fillColor,
                    }),
                    stroke: new lizMap.ol.style.Stroke({
                        color: strokeColor,
                        width: strokeWidth,
                    }),
                }),
                // Label
                text: new lizMap.ol.style.Text({
                    text: labelText,
                    font: 'bold 14px sans-serif',
                    fill: new lizMap.ol.style.Fill({
                        color: strokeColor,
                    }),
                    offsetY: 1,
                    justify: 'center'
                })
            });
        }
    });

    // Set layer name
    routingPointLayer.set('name', 'ign-routing-point-layer')

    lizMap.mainLizmap.map.addToolLayer(routingPointLayer);
    this.routingPointLayer = routingPointLayer

    // Add start and end points
    // start
    startFeature = new lizMap.ol.Feature(
        new lizMap.ol.geom.Point(startPointCoordinates[0], startPointCoordinates[1]),
    );
    startFeature.setProperties({'fid': 0, 'name': 'start'});
    startFeature.setId(0);

    // end
    endFeature = new lizMap.ol.Feature(
        new lizMap.ol.geom.Point(endPointCoordinates[0], startPointCoordinates[1]),
    );
    endFeature.setProperties({'fid': 1, 'name': 'end'});
    endFeature.setId(1);

    // Add the features
    routingPointLayer.getSource().addFeatures([startFeature, endFeature]);

    // Add drag & drop control
    // pointSelector = new lizMap.ol.interaction.Select({wrapX: false});
    pointModifier = new lizMap.ol.interaction.Modify({
        source: routingPointLayer_source
    });
    pointModifier.on('modifyend', function (evt) {
        const modifiedFeature = evt.features.getArray()[0];
        const coordinates = modifiedFeature.getGeometry().getCoordinates();
        const coordinatesGps = lizMap.mainLizmap.transform(coordinates, lizMap.mainLizmap.projection, 'EPSG:4326');

        // Start or end feature ?
        let textInput = (modifiedFeature.get('fid') == 0) ? 'ign_start_address' : 'ign_end_address';
        document.getElementById(textInput).value = `${coordinatesGps[0]}, ${coordinatesGps[1]}`;

        // Reverse geocode adresse
        let routingTool = new IgnRouting();
        let reverse = routingTool.reverseGeocodePoint(coordinatesGps[0], coordinatesGps[1]);
        reverse.then((geojson) => {
            if (geojson !== null && geojson.features.length == 1) {
                // Get reverse geocoding returned object properties
                let properties = geojson['features'][0]['properties'];
                document.getElementById(textInput).value = properties['label'];
            }
        });

        // Relancer le calcul d'itinéraire
        getRouteFromPoints();

        // Show the layers
        let routingPointLayer = getRoutingLayerByName('ign-routing-point-layer')
        if (routingPointLayer) routingPointLayer.setVisible(true);
        let routingRouteLayer = getRoutingLayerByName('ign-routing-route-layer')
        if (routingRouteLayer) routingRouteLayer.setVisible(true);
    });

    lizMap.mainLizmap.map.addInteraction(pointModifier);

    // Hide layers
    this.routingPointLayer.setVisible(false);
    this.routingRouteLayer.setVisible(false);


}


/**
 * Activate the HTML elements (click, change, etc.).
 *
 * Detect the change inside the start and end text inputs.
 * Detect the click on the buttons.
 */
function activateHtmlElements() {

    // Action sur modification des champs texte
    let item_adresse_depart = document.getElementById('ign_start_address');
    let item_adresse_arrivee = document.getElementById('ign_end_address');
    item_adresse_depart.addEventListener('change', onAddressModified);
    item_adresse_arrivee.addEventListener('change', onAddressModified);

    // Detect change on routing profile
    const profileElement = document.getElementById('ign_routing_profile');
    profileElement.addEventListener('change', onRoutingProfileChanged);

    // Button for linking the start point to the GPS location
    let bindGpsButton = document.getElementById('ign_bind_geolocation');
    bindGpsButton.onclick = function () {
        let isActive = bindGpsButton.classList.contains('active');
        if (isActive) {
            bindGpsButton.classList.remove('active');
            bindGpsButton.classList.remove('btn-success');
            lizMap.mainEventDispatcher.removeListener(
                setStartFromGeolocation,
                'geolocation.position'
            );
        }
        else {
            if (!lizMap.mainLizmap.geolocation.isTracking) {
                alert('Veuillez activer la géolocalisation pour pouvoir utiliser cette fonctionnalité')
                return false;
            }
            if (lizMap.mainLizmap.geolocation._geolocation.getPosition()) {
                setStartFromGeolocation();
            }
            bindGpsButton.classList.add('active');
            bindGpsButton.classList.add('btn-success');
            lizMap.mainEventDispatcher.addListener(
                setStartFromGeolocation,
                'geolocation.position'
            );
        }
    };

    // Bouton pour réinitialiser la carte et les champs texte
    let reinitializeButton = document.getElementById('ign_reinitialize');
    reinitializeButton.onclick = function () {
        reinitializeRoutingTool();
    };

}


/**
 * Reinitialize the routing tool by emptying the text inputs
 * and removing any geometries in the map layer.
 */
function reinitializeRoutingTool() {

    // Empty the address text input
    const item_adresse_depart = document.getElementById('ign_start_address');
    const item_adresse_arrivee = document.getElementById('ign_end_address');
    const profileElement = document.getElementById('ign_routing_profile');
    item_adresse_depart.value = '';
    item_adresse_arrivee.value = '';
    profileElement.value = 'car';

    // Hide the layers
    let routingPointLayer = getRoutingLayerByName('ign-routing-point-layer')
    if (routingPointLayer) routingPointLayer.setVisible(false);
    let routingRouteLayer = getRoutingLayerByName('ign-routing-route-layer')
    if (routingRouteLayer) routingRouteLayer.setVisible(false);

    // Remove event
    lizMap.mainEventDispatcher.removeListener(
        setStartFromGeolocation,
        'geolocation.position'
    );
    let bindGpsButton = document.getElementById('ign_bind_geolocation');
    bindGpsButton.classList.remove('active');
    bindGpsButton.classList.remove('btn-success');
}


/**
 * Modify the start or the end OpenLayers point position
 * by the one given in the geojson parameter.
 */
function addPointFromGeoJSON(geojson, targetNode = 'start') {
    // Read GeoJSON and transform coordinates
    const geoJSONFeatures = new lizMap.ol.format.GeoJSON().readFeatures(geojson, {
        dataProjection: 'EPSG:4326',
        featureProjection: lizMap.mainLizmap.projection
    });
    const newFeature = geoJSONFeatures[0];
    const newGeometry = newFeature.getGeometry();

    // Get feature to modify depending on targetNode
    let indexes = { 'start': 0, 'end': 1 };
    let index = indexes[targetNode];

    const targetFeature = this.routingPointLayer.getSource().getFeatureById(index)
    if (!targetFeature) {
        return;
    }
    // Set the target point geometry
    targetFeature.setGeometry(newGeometry);

    // layer.redraw();
}

/**
 * Geocode the new address anytime the user
 * changes the address text input value.
 */
function onAddressModified(e) {
    // Récupère la valeur du champ texte modifié
    let adresse = e.target.value;
    let destination = e.target.name;

    if (adresse == '') {
        return true;
    }

    // On récupère l'adresse par géocodage avec l'API IGN
    let routingTool = new IgnRouting();
    let geocoding = routingTool.geocodeAddress(adresse);

    // Comme la fonction geocodeAddress est asynchrone
    // elle renvoie une promesse et non l'objet résultat
    // on doit donc utiliser la méthode then pour travailler dessus
    let msgElt = document.getElementById('lizmap-ign-routing-message');
    if (msgElt) msgElt.remove();
    lizMap.addMessage(
        "Géocodage en cours...", 'info', true
    ).attr('id', 'lizmap-ign-routing-message');
    geocoding.then((geojson) => {

        msgElt = document.getElementById('lizmap-ign-routing-message');
        if (geojson !== null) {

            let properties = geojson['features'][0]['properties'];
            if (msgElt) msgElt.remove();

            // Remplacer l'adresse fournie par celle récupérée
            e.target.value = properties['label'];

            // Afficher le point sur la carte
            addPointFromGeoJSON(geojson, destination);

            // Relancer le calcul d'itinéraire
            getRouteFromPoints();

            // Show the layers
            let routingPointLayer = getRoutingLayerByName('ign-routing-point-layer')
            if (routingPointLayer) routingPointLayer.setVisible(true);
            let routingRouteLayer = getRoutingLayerByName('ign-routing-route-layer')
            if (routingRouteLayer) routingRouteLayer.setVisible(true);
        }

    });
}

/**
 * Reload routing when profile has changed
 *
 */
function onRoutingProfileChanged(e) {
    const profile = e.target.value;
    // Relancer le calcul d'itinéraire
    getRouteFromPoints();
}

/**
 * Get the start and end points drawn on the map,
 * and then get the route from the API
 * and display it on the map.
 */
function getRouteFromPoints() {

    // Get points
    const startFeature = this.routingPointLayer.getSource().getFeatureById(0);
    const startCoordinates = startFeature.getGeometry().getCoordinates();
    if (!startCoordinates || startCoordinates.length != 2 || startCoordinates == [0, 0]) return;
    const startCoordinatesGps = lizMap.mainLizmap.transform(
        startCoordinates,
        lizMap.mainLizmap.projection,
        'EPSG:4326'
    );
    const endFeature = this.routingPointLayer.getSource().getFeatureById(1);
    const endCoordinates = endFeature.getGeometry().getCoordinates();
    if (!endCoordinates || endCoordinates.length != 2 || endCoordinates == [0, 0]) return;
    const endCoordinatesGps = lizMap.mainLizmap.transform(
        endCoordinates,
        lizMap.mainLizmap.projection,
        'EPSG:4326'
    );

    const profileElement = document.getElementById('ign_routing_profile');
    const profile = profileElement.value;

    // Query the route from the API
    let routingTool = new IgnRouting();
    let routing = routingTool.getRoute(
        [startCoordinatesGps[0], startCoordinatesGps[1]],
        [endCoordinatesGps[0], endCoordinatesGps[1]],
        profile
    );

    // Get route in JSON format and display it on map
    let msgElt = document.getElementById('lizmap-ign-routing-message');
    if (msgElt) msgElt.remove();
    lizMap.addMessage(
        "Calcul d'itinéraire en cours...", 'info', true
    ).attr('id', 'lizmap-ign-routing-message');
    routing.then((json) => {
        if (json !== null) {
            let geojson = {
                "type": "FeatureCollection",
                "features": [
                    { "type": "Feature", "geometry": json.geometry, "properties": { 'fid': 2 } }
                ]
            };

            // Display the route in the map
            let msgElt = document.getElementById('lizmap-ign-routing-message');
            if (msgElt) msgElt.remove();
            addRouteFromGeoJSON(geojson);
        }
    });
}


/**
 * Replace the route geometry in the map
 * with the geometry returned by the API
 * and given in the geojson parameter.
 */
function addRouteFromGeoJSON(geojson) {
    // Read GeoJSON and transform response to the map projection
    const routeFeatures = new lizMap.ol.format.GeoJSON().readFeatures(geojson, {
        dataProjection: 'EPSG:4326',
        featureProjection: lizMap.mainLizmap.projection
    });
    const previousFeature = this.routingRouteLayer.getSource().getFeatureById(1);
    if (routeFeatures && previousFeature) {
        const routeFeature = routeFeatures[0];
        previousFeature.setGeometry(routeFeature.getGeometry());

        // Zoom to the route feature
        // Use padding
        const targetExtent = routeFeature.getGeometry().getExtent();
        const paddingX = Math.abs(targetExtent[2] - targetExtent[0]) / 6;
        const paddingY = Math.abs(targetExtent[3] - targetExtent[1]) / 6;
        const targetExtentPadded = [
            targetExtent[0] - paddingX,
            targetExtent[1] - paddingY,
            targetExtent[2] + paddingX,
            targetExtent[3] + paddingY
        ];
        lizMap.mainLizmap.extent = targetExtentPadded;
    }


}

/**
 * Change the position of the start point
 * with the one returned by the Geolocation tool
 * (current GPS position).
 *
 * This will also trigger the calculation of a new
 * route by triggering the featuremodified OL event.
 */
function setStartFromGeolocation() {
    if (!lizMap.mainLizmap.geolocation.isTracking) {
        return false;
    }

    // Create geometry from the location
    let [lon, lat] = lizMap.mainLizmap.geolocation.getPositionInCRS('EPSG:4326');

    // Transform coordinates
    const coordinates = lizMap.mainLizmap.transform([lon, lat], 'EPSG:4326', lizMap.mainLizmap.projection);
    const newGeometry = new lizMap.ol.geom.Point(coordinates);

    // Set the start point
    let startFeature = this.routingPointLayer.getSource().getFeatureById(0);
    startFeature.setGeometry(newGeometry);

    // Update the route
    getRouteFromPoints();
}


/**
 * Get routing layer by its name
 * NB: not possible to use lizmap getLayerByName
 * since the layers added in this script have been added
 * with addToolLayer
 *
 * @param {string} layerName Name of the layer
 * @return {null|object} OpenLayer layer object
 *
 */
function getRoutingLayerByName(layerName)
{
    let layer = null;
    lizMap.mainLizmap.map.getAllLayers().forEach(item => {
        if (item.get('name') == layerName) {
            layer = item;
        }
    })

    return layer;
}

/**
 * Activate the tool when Lizmap interface is ready
 */
lizMap.events.on({
    uicreated: function () {
        // Add OpenLayers layer
        createRoutingMapLayers();

        // Ajout du panneau avec le contenu HTML de l'outil
        addRoutingDock();

        // Activer les éléments d'interface
        activateHtmlElements();
    },

    minidockopened: function (evt) {
        if (evt.id == 'ign_itineraire') {
            // Remove popup
            lizMap.mainLizmap.popup.active = false;

            // Show the layers
            let routingPointLayer = getRoutingLayerByName('ign-routing-point-layer');
            if (routingPointLayer) routingPointLayer.setVisible(true);
            let routingRouteLayer = getRoutingLayerByName('ign-routing-route-layer');
            if (routingRouteLayer) routingRouteLayer.setVisible(true);

            // If no point has been set, add a message
            const startFeature = routingPointLayer.getSource().getFeatureById(0);
            const endFeature = routingPointLayer.getSource().getFeatureById(1);
            const startCoordinates = startFeature.getGeometry().getCoordinates();
            const endCoordinates = endFeature.getGeometry().getCoordinates();
            if (startCoordinates.length == 0 || startCoordinates == [0, 0]
                || endCoordinates.length == 0 || endCoordinates == [0, 0]
            ) {
                let msgElt = document.getElementById('lizmap-ign-routing-message');
                if (msgElt) msgElt.remove();
                lizMap.addMessage(
                    "Pour calculer un itinéraire, entrer une adresse de départ puis une adresse d'arrivée", 'info', true, 5000
                ).attr('id', 'lizmap-ign-routing-message');
            }
        }
    },

    minidockclosed: function (evt) {
        if (evt.id == 'ign_itineraire') {
            // Activate popup
            lizMap.mainLizmap.popup.active = true;

            // Hide the layers
            let routingPointLayer = getRoutingLayerByName('ign-routing-point-layer')
            if (routingPointLayer) routingPointLayer.setVisible(false);
            let routingRouteLayer = getRoutingLayerByName('ign-routing-route-layer')
            if (routingRouteLayer) routingRouteLayer.setVisible(false);

            // Remove message if any
            let msgElt = document.getElementById('lizmap-ign-routing-message');
            if (msgElt) msgElt.remove();
        }
    }
});
