/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */
 
// ID of the dock (do not change)
const DOCK_ID = 'panoramax';

// Icon of the dock menu and used before each link
// See https://getbootstrap.com/2.3.2/base-css.html#icons
const DOCK_ICON = 'icon-camera';

// Dock position: can be dock, minidock
const DOCK_POSITION = 'dock';

// Title of the dock
const DOCK_TITLE = 'Panoramax';

// Panoramax Vector Tile Layer in QGIS
// VERY IMPORTANT => The layer name must be the same as the one in QGIS
const PANORAMAX_QGIS_LAYER_NAME = "Panoramax"

// ARROW ICON PROPERTIES
const ARROW_ICON_SIZE = 0.3;
const ARROW_ICON_COLOR = "#e4e8e6";

const PANORAMAX_INSTANCE = 'https://api.panoramax.xyz/api';

const CONTENT_TEXT = {
    "fr"  : "Veuillez cliquer sur un point de la couche Panoramax pour afficher les photos."
    ,"en" : "Please click on a point in the Panoramax layer to display the photos."
    ,"it" : "Per favore, fai clic su un punto del livello Panoramax per visualizzare le foto."
    ,"es" : "Por favor, haz clic en un punto de la capa Panoramax para mostrar las fotos."
    ,"de" : "Bitte klicken Sie auf einen Punkt in der Panoramax-Schicht, um die Fotos anzuzeigen."
    ,"pt" : "Por favor, clique em um ponto da camada Panoramax para exibir as fotos."
    ,"nl" : "Klik alstublieft op een punt in de Panoramax-laag om de foto's te bekijken."
    ,"pl" : "Kliknij punkt na warstwie Panoramax, aby wyświetlić zdjęcia."
};

//Change text depending on navigator language
const DEFAULT_LANGUAGE = "en"
const NAVIGATOR_LANGUAGE = navigator.language ? navigator.language.slice(0, 2) : DEFAULT_LANGUAGE;
//IF the navigator.language is not listed in CONTENT_TEXT => switch to the DEFAULT_LANGUAGE
const POPUP_TEXT = CONTENT_TEXT[NAVIGATOR_LANGUAGE] ? CONTENT_TEXT[NAVIGATOR_LANGUAGE] : CONTENT_TEXT[DEFAULT_LANGUAGE];

const DEBUG_MODE = false;

/** ********************************
 ###################################
    DO NOT MODIFY BELOW THIS LINE
 ###################################
 ******************************** */

 // HTML Content 
const DOM_ID_PANORAMAX = "LizPanoramax-viewer";
const HTML_TEMPLATE = `<div id="panoramax_dock_content">
                            <p>${POPUP_TEXT}</p>
                            <div id="${DOM_ID_PANORAMAX}" style="width: auto; height: 300px;"></div>
                        </div>`;

const SVG_ARROW = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><path d="M48.005 2.666a2.386 2.386 0 0 0-.51.397 2.386 2.386 0 0 0-.531.844l-33.169 90.76a2.386 2.386 0 0 0 3.52 2.836l32.08-20.345 32.186 20.177a2.386 2.386 0 0 0 3.506-2.854L51.442 3.894a2.386 2.386 0 0 0-3.437-1.228Z" style="color:#000;font-style:normal;font-variant:normal;font-weight:400;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000;solid-opacity:1;vector-effect:none;fill:${ARROW_ICON_COLOR};fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000"/></svg>`;

class LizPanoramax{
    constructor(){
        //Check if Panoramax Layer exists. If not, display an error message and exit directly
        this.panoramaxLayer = this.#getPanoramaxLayer();
        
        if(!this.panoramaxLayer) {       
            // check if there is a panoramax layer in the project      
            const error = `No Panoramax layer available. 
                           You must add a Panoramax Layer into your QGIS project 
                           and be sure that the PANORAMAX_QGIS_LAYER_NAME is the same as your QGIS Panoramax Layer name`
            if (DEBUG_MODE)  console.error(error);
            this.#addLizmapDock(`<p style="color:red; font-weight:bold;"> ${error} </p>`);
            return
        }

        //Panoramax Layer has been found. The JS/CSS Script can be loaded
        this.#loadScripts().then(success => {
            if(!success){                
                const error = "Panoramax external script not fully loaded"
                if (DEBUG_MODE) console.error(error);
                this.#addLizmapDock(`<p style="color:red; font-weight:bold;"> ${error} </p>`);
                return
            }
            
            // everything is good we can display the "normal" dock content
            this.#addMapEvent();
            this.#addLizmapDock(HTML_TEMPLATE);
            //this.#setPanoramaxLayerVisibility(false);
            this.#addPanoramaxHeadingLayer(); 
        });            
    }
   
    /**
     * LOAD PANORAMAX EXTERNAL JS AND CSS
     * @returns {Promise<boolean>}
     */
    async #loadScripts() {
        return new Promise(resolve => {
            
            const panoramax_js = 'https://cdn.jsdelivr.net/npm/@panoramax/web-viewer@3.2.3/build/index.min.js';
            const panoramax_css = 'https://cdn.jsdelivr.net/npm/@panoramax/web-viewer@3.2.3/build/index.min.css'

            if (!document.querySelector(`script[src="${panoramax_js}"]`)) {
                // Chargement du script JS
                const script = document.createElement('script');
                script.src = panoramax_js;
                script.setAttribute('type', 'text/javascript');

                script.onload = function () {
                    resolve(true);
                };

                script.onerror = function () {
                    if (DEBUG_MODE) console.error("Échec du chargement du script.");
                    resolve(false);
                };

                document.head.appendChild(script);
                
            }

            if (!document.querySelector(`link[href="${panoramax_css}"]`)) {
                // Chargement du CSS
                const style = document.createElement("link");
                style.href = panoramax_css;
                style.rel = 'stylesheet';
                style.type = 'text/css';
                document.head.appendChild(style);
            }            
        });
    }

    /**
     * Get Panoramax Layer
     * The PANORAMAX_QGIS_LAYER_NAME must be the same as the one QGIS 
     * @returns OpenLayers Layer
     */
    #getPanoramaxLayer(){
        try {
            let PanoramaxLayer = lizMap.mainLizmap.state.rootMapGroup.getMapLayerByName(PANORAMAX_QGIS_LAYER_NAME);
            return PanoramaxLayer;
        } catch (error) {
            return false
        }        
    }

    /**
     * Add Lizmap Dock
     * @param {*} htmlContent 
     */
    #addLizmapDock(htmlContent){        
        lizMap.addDock(
            DOCK_ID,
            DOCK_TITLE,
            DOCK_POSITION,
            htmlContent,
            DOCK_ICON
        );
    }

    /**
     * add layer to draw that will be used to draw arrow direction
     * @returns Openlayers Layer
     */
    #addPanoramaxHeadingLayer(){
        this.layerArrowHeadingSource = new lizMap.ol.source.Vector({ wrapX: false });
        this.layerArrowHeading = new lizMap.ol.layer.Vector({
            title: 'panoramax-pov',
            source: this.layerArrowHeadingSource,
            style: new lizMap.ol.style.Style({
                image: new lizMap.ol.style.Icon({
                    src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG_ARROW),
                    scale: ARROW_ICON_SIZE
                })
            }),
        });
        this.layerArrowHeading.setZIndex(1001);
        lizMap.mainLizmap.map.addLayer(this.layerArrowHeading);
        return 
    }

    /**
     * Set Arrow Heading depending on picture parameter
     * @param {Panoramax Picture} picture 
     */
    #setPanoramaxHeadingLayerHeading(picture){
        const oldFeature = this.layerArrowHeadingSource.getFeatures()?.[0];
        if (oldFeature) {
            this.layerArrowHeadingSource.removeFeature(oldFeature);
        }
        
        this.layerArrowHeadingSource.addFeature(new lizMap.ol.Feature({
            geometry: new lizMap.ol.geom.Point([
                picture.geometry.coordinates[0], 
                picture.geometry.coordinates[1]
            ]).transform('EPSG:4326', lizMap.map.projection.projCode)
        }));
        const r = picture.properties["view:azimuth"] * (Math.PI/180);
        this.layerArrowHeading.getStyle().getImage().setRotation(r);
        this.layerArrowHeading.changed();
    }

    /**
     * Hide/Show Panoramax layer
     * @param {boolean} visibility 
     */
    #setPanoramaxLayerVisibility(visibility){
        if(this.panoramaxLayer){
            this.panoramaxLayer.checked = visibility;
        }
    }    

    /**
     * Init all the method
     */
    initPanoramaxDock(){
        if(this.panoramaxLayer){
            lizMap.mainLizmap.popup.active = false;
            this.panoramaxDockOpen = true;
            this.#setPanoramaxLayerVisibility(true);
            this.#addPanoramaxViewer();
        }
    }

    /**
     * Add Panoramax Viewer 
     */
    #addPanoramaxViewer(){
        this.panoViewer = new Panoramax.Viewer(
            DOM_ID_PANORAMAX,
            PANORAMAX_INSTANCE,
            { 
                hash:false, // !!! do not change => change Lizmap URL
                map: false
            }  
        );
        this.#addPanoramaxViewerEvent();
    }

    /**
     * Add all Panoramax Viewer Events
     */
    #addPanoramaxViewerEvent(){
        this.panoViewer.addEventListener('psv:view-rotated', (e) => {
            if(e.explicitOriginalTarget._selectedPicId){
                let r = e.detail.x * (Math.PI/180); 
                this.layerArrowHeading.getStyle().getImage().setRotation(r);
                this.layerArrowHeading.changed();
            }
        });
        
        this.panoViewer.addEventListener('psv:picture-loaded', (e) => {
            let r = e.detail.x * (Math.PI/180); 
            if(this.layerArrowHeadingSource.getFeatures()[0] && e.detail.lon && e.detail.lat){
                const coords = lizMap.ol.proj.transform([e.detail.lon, e.detail.lat], 'EPSG:4326', lizMap.mainLizmap.projection);
                lizMap.mainLizmap.map.getView().setCenter(coords);
                this.layerArrowHeadingSource.getFeatures()[0].getGeometry().setCoordinates(coords);                        
            }
            this.layerArrowHeading.getStyle().getImage().setRotation(r);
            this.layerArrowHeading.changed();
        }); 
    }

    /**
     * Fetch picture on single map cick
     */
    #addMapEvent(){
        lizMap.mainLizmap.map.on('singleclick', e => {
            //Fire event only if panoramax dock is opened 
            if(this.panoramaxDockOpen){             
                const extent =this.#getBufferedExtent(e.coordinate);
                this.#getPanoramaxPicture(extent);
            }            
        });
    }

    /**
     * 
     * @param {*} point 
     * @returns Array coordinates
     */
    #getBufferedExtent(p){
        const point  = new lizMap.ol.geom.Point(p);
        const extent = point.getExtent();
        const radius = 3;
        const bufferedExtent = new lizMap.ol.extent.buffer(extent,radius);

        const pbl = new lizMap.ol.geom.Point([bufferedExtent[0], bufferedExtent[1]]); //bottom left
        const pur = new lizMap.ol.geom.Point([bufferedExtent[2], bufferedExtent[3]]); //upper right

        if(lizMap.map.projection.projCode != "EPSG:4326"){
            // reproject extent to 4326
            pbl.transform(lizMap.map.projection.projCode, 'EPSG:4326');
            pur.transform(lizMap.map.projection.projCode, 'EPSG:4326');              
        }
        return [pbl.flatCoordinates, 
                pur.flatCoordinates];
    }

    /**
     * Query Panoramax API
     * @param {[bl_x,bl_y,upr_x,up_y]} extent 
     */
    async #getPanoramaxPicture(extent){
        //URL example : https://api.panoramax.xyz/api/search?limit=1&bbox=55.500236%2C-20.892392%2C55.500238%2C-20.892390
        //Coord -20.89238774,55.50023601
        // -> Should return 9df3252f-dcad-42db-b46e-6d3e52571acb photo id
        
        try {
            const PanoramaxSearchParams = new URLSearchParams({ 
                'limit': 1 
                ,'bbox':`${extent[0][0].toFixed(6)},${extent[0][1].toFixed(6)},${extent[1][0].toFixed(6)},${extent[1][1].toFixed(6)}`
            });
            const response = await fetch(`${PANORAMAX_INSTANCE}/search?${PanoramaxSearchParams}`);
            if (!response.ok) {
                const error = `Erreur HTTP: ${response.status}`;
                if (DEBUG_MODE)  console.error(error);
                throw new Error(error);                
            }
            const picture = await response.json();
            if(picture.features.length){
                this.panoViewer.select(null, picture.features[0].id, true);
                this.#setPanoramaxHeadingLayerHeading(picture.features[0]);
            }
        } catch (error) {
            if (DEBUG_MODE)  console.error(error);
            throw new Error(error);  
        }
    }

    /**
     * Remove all Panoramax object and instance
     */
    removePanoramaxDock(){      
        if(this.panoramaxLayer) {
            lizMap.mainLizmap.popup.active = true;
            this.panoramaxDockOpen = false;
            this.layerArrowHeadingSource.clear();
        
            //Hide layer
            lizPanoramax.#setPanoramaxLayerVisibility(false);

            // Remove all viewer references
            if (this.panoViewer) {
                this.panoViewer.stopSequence();
                //this.panoViewer.destroy(); // --> Should be used for removing object but currently throwing an error
                const panoViewer = document.querySelector(`#panoramax_dock_content #${DOM_ID_PANORAMAX}`);
                if(panoViewer){
                    panoViewer.remove();
                    document.querySelector("#panoramax_dock_content").insertAdjacentHTML('beforeend', `<div id="${DOM_ID_PANORAMAX}" style="width: auto; height: 300px;"></div>`);     
                }
                delete this.panoViewer;
            }
        }
    }
}

/**
 * Lizmap event
 */
lizMap.events.on({
    'uicreated': function(e) {
        lizPanoramax = new LizPanoramax();     
    }, 

    //MINI DOCK
    'minidockopened': e => {
        if (e.id === DOCK_ID) {   
            lizPanoramax.initPanoramaxDock();               
        }
    },
    'minidockclosed': e => {
        if (e.id === DOCK_ID) {
            lizPanoramax.removePanoramaxDock();            
        }
    },

    //DOCK
    'dockopened': e => {
        if (e.id === DOCK_ID) {   
            lizPanoramax.initPanoramaxDock();               
        }
    },
    'dockclosed': e => {
        if (e.id === DOCK_ID) {
            lizPanoramax.removePanoramaxDock();            
        }
    },
});
