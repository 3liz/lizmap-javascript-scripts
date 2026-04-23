/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

const lizmapPanoramax = function() {
    
    // ID of the dock (do not change)
    const DOCK_ID = 'panoramax';
    
    // Icon of the dock menu and used before each link
    // See https://getbootstrap.com/2.3.2/base-css.html#icons
    const DOCK_ICON = 'icon-camera';
    
    // Dock position: can be dock, minidock
    const DOCK_POSITION = 'dock';
        
    // Title of the dock
    const DOCK_TITLE = 'Panoramax';
    
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
    const POPUP_TEXT = CONTENT_TEXT[NAVIGATOR_LANGUAGE] || CONTENT_TEXT[DEFAULT_LANGUAGE];

    const DEBUG_MODE = false;
    
    /** ********************************
     ###################################
        DO NOT MODIFY BELOW THIS LINE
     ###################################
     ******************************** */
    
    const PANORAMAX_JS_URL = 'https://cdn.jsdelivr.net/npm/@panoramax/web-viewer@4.4.0/build/index.min.js';
    const PANORAMAX_CSS_URL = 'https://cdn.jsdelivr.net/npm/@panoramax/web-viewer@4.4.0/build/index.min.css'
    
    // HTML Content 
    const PHOTO_VIEWER = `<pnx-photo-viewer 
                                    endpoint="${PANORAMAX_INSTANCE}"
                                    widgets="false"
                                    url-parameters="false"
                                    style="width: 100%; height: 300px;">
                                </pnx-photo-viewer>`;

    const HTML_TEMPLATE = `<div id="panoramax_dock_content">
                            <p>${POPUP_TEXT}</p>
                            ${PHOTO_VIEWER}
                        </div>`;
    
    const SVG_ARROW = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><path d="M48.005 2.666a2.386 2.386 0 0 0-.51.397 2.386 2.386 0 0 0-.531.844l-33.169 90.76a2.386 2.386 0 0 0 3.52 2.836l32.08-20.345 32.186 20.177a2.386 2.386 0 0 0 3.506-2.854L51.442 3.894a2.386 2.386 0 0 0-3.437-1.228Z" style="color:#000;font-style:normal;font-variant:normal;font-weight:400;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000;solid-opacity:1;vector-effect:none;fill:${ARROW_ICON_COLOR};fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000"/></svg>`;
    
    const PANORAMAX_SOURCES = {
        IGN: {
            url: 'https://panoramax.ign.fr/api/map/{z}/{x}/{y}.mvt',
            maxZoom: 15,
        },
        OSM: {
            url: 'https://panoramax.openstreetmap.fr/api/map/{z}/{x}/{y}.mvt',
            maxZoom: 15,
        }
    };

    const PANORAMAX_LAYER_CONFIG = {
        name: 'Panoramax Images',
        visibleOnStartUp: false,       
        zIndex: 100
    };

    class LizPanoramax{
        constructor(){
            // Initialize state
            this.panoramaxDockOpen = false;
            this.panoramaxVectorLayers = null;  
            this.panoramaxLayersGroup = null;   
            
            // Initialize map handlers
            this.mapClickHandler = null;
            this.panoramaxLayerClickHandler = null; 
            
            // Initialize viewer listeners
            this.panoViewerListeners = {
                'psv:view-rotated': null
            };

            // Load external scripts (Panoramax viewer)
            this.#loadScripts().then(success => {
                if(!success){                
                    const error = "Panoramax external script not fully loaded";
                    if (DEBUG_MODE) console.error(error);
                    this.#addLizmapDock(`<p style="color:red; font-weight:bold;"> ${error} </p>`);
                    return;
                }
                
                // Scripts loaded successfully, display dock content
                this.#addLizmapDock(HTML_TEMPLATE);
                
                // Create Vector Tile layers (no longer dependent on QGIS)
                if (!this.panoramaxVectorLayers) {
                    this.panoramaxVectorLayers = this.#addPanoramaxVectorLayers();
                    
                    if (DEBUG_MODE) {
                        console.log('Panoramax Vector Tile layers created and registered');
                    }
                }
            });
        }
       
        /**
         * LOAD PANORAMAX EXTERNAL JS AND CSS
         * @returns {Promise<boolean>}
         */
        async #loadScripts() {
            return new Promise(resolve => {

                let scriptLoaded = !!document.querySelector(`script[src="${PANORAMAX_JS_URL}"]`);
                let cssLoaded = !!document.querySelector(`link[href="${PANORAMAX_CSS_URL}"]`);

                let jsPromise, cssPromise;

                if (!scriptLoaded) {
                    jsPromise = new Promise(jsResolve => {
                        const script = document.createElement('script');
                        script.src = PANORAMAX_JS_URL;
                        script.type = 'text/javascript';
                        script.onload = () => jsResolve(true);
                        script.onerror = () => {
                            if (DEBUG_MODE) console.error("Échec du chargement du script.");
                            jsResolve(false);
                        };
                        document.head.appendChild(script);
                    });
                } else {
                    jsPromise = Promise.resolve(true);
                }

                if (!cssLoaded) {
                    cssPromise = new Promise(cssResolve => {
                        const style = document.createElement("link");
                        style.href = PANORAMAX_CSS_URL;
                        style.rel = 'stylesheet';
                        style.type = 'text/css';
                        style.onload = () => cssResolve(true);
                        style.onerror = () => {
                            if (DEBUG_MODE) console.error("Échec du chargement du CSS.");
                            cssResolve(false);
                        };
                        document.head.appendChild(style);
                    });
                } else {
                    cssPromise = Promise.resolve(true);
                }

                Promise.race([
                    Promise.all([jsPromise, cssPromise]),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('CDN timeout')), 10000)
                    )
                ]).then(results => {
                    resolve(results.every(Boolean));
                }).catch(error => {
                    if (DEBUG_MODE) console.error('Script loading failed:', error);
                    resolve(false);
                });      
            });
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
        * Create and add Panoramax Vector Tile layers to the map
        * @returns {Array} Array of panoramax layers
        */
        #addPanoramaxVectorLayers() {
            const layers = [];
            
            Object.entries(PANORAMAX_SOURCES).forEach(([key, config]) => {
                
                // Create VectorTile source
                const source = new lizMap.ol.source.VectorTile({
                    url: config.url,
                    format: new lizMap.ol.format.MVT(),
                    maxZoom: config.maxZoom,
                    tileGridStrategy: 'all'
                });               

                // Create VectorTile layer
                const layer = new lizMap.ol.layer.VectorTile({
                    title: `${PANORAMAX_LAYER_CONFIG}.name ${key}`,
                    source: source,
                    zIndex: PANORAMAX_LAYER_CONFIG.zIndex,
                    style: this.#setPanoramaxLayerStyle(),
                    projection: 'EPSG:3857'
                });                

                lizMap.mainLizmap.map.addLayer(layer);  
                layer.setVisible(PANORAMAX_LAYER_CONFIG.visibleOnStartUp);
                layers.push(layer);
            });
            return layers;
        }

        /**
         * Define styling for Panoramax layers
         * NOTE : COULD BE PASSED AS PARAMETERS FOR THE NEXT VERSION          
         * @returns {Function} Style function
         */
        #setPanoramaxLayerStyle() {
            // Default style
            const fill = new lizMap.ol.style.Fill({
                color: 'rgba(255,255,255,0.4)',
            });
            const stroke = new lizMap.ol.style.Stroke({
                color: '#3399CC',
                width: 1.25,
            });
            const style = new lizMap.ol.style.Style({
                image: new lizMap.ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 5,
                }),
                fill: fill,
                stroke: stroke,
            });
            return style;
        }

        /**
         * Toggle Panoramax layers visibility
         * @param {boolean} visible 
         */
        #setPanoramaxLayersVisibility(visible) {
            if (this.panoramaxVectorLayers) {
                this.panoramaxVectorLayers.forEach((layer) => {
                    layer.setVisible(visible);
                });
            }
        }

        /**
         * Add click handler to Panoramax vector tile layers
         */
        #addPanoramaxLayerClickEvent() {
            this.panoramaxLayerClickHandler = (e) => {
                if (!this.panoramaxDockOpen) return;                
            
                const features = lizMap.mainLizmap.map.getFeaturesAtPixel(e.pixel, 
                    function (feature) {     
                        return feature;
                    },{
                    layerFilter: (layer) => {
                        return this.panoramaxVectorLayers && 
                            this.panoramaxVectorLayers.some(({ layer: l }) => l === layer);
                    }
                });  
            
                if (features.length > 0) {                      
                    const feature = features[0];                  
                    if(feature.getProperties()?.id){
                        const pictureId = feature.getProperties().id;
                        this.panoViewer?.select?.(null, pictureId, true);
                        this.#setPanoramaxHeadingLayer(feature);        
                    }                       
                }
            };
            lizMap.mainLizmap.map.on('singleclick', this.panoramaxLayerClickHandler);
        }

        /**
         * Remove Vector Tile layer click handler
         */
        #removePanoramaxLayerClickEvent() {
            if (this.panoramaxLayerClickHandler) {
                lizMap.mainLizmap.map.un('singleclick', this.panoramaxLayerClickHandler);
                this.panoramaxLayerClickHandler = null;
            }
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
            return this.layerArrowHeading
        }
    
        /**
         * Set Arrow Heading depending on picture parameter
         * @param {Panoramax Picture} picture 
         */
        #setPanoramaxHeadingLayer(picFeature){           
            // Vérifie l'existence de la couche et de sa source avant de tenter de les utiliser
            if(!this.layerArrowHeadingSource || !this.layerArrowHeading) {
                if (DEBUG_MODE) console.warn("Heading layer not initialized");
                return;
            }      
                        
            if (!picFeature?.flatCoordinates_ || !Array.isArray(picFeature.flatCoordinates_) || picFeature.flatCoordinates_.length != 2){
                if (DEBUG_MODE) console.warn("Wrong picture coordinates", picFeature.flatCoordinates_);
                return;
            }
            
            // Accès à propriété privée OpenLayers
            // Il doit y avoir un moyen plus simple d'accéder aux coordonnées 
            // ex. getCoordinates() -> mais retourne une erreur
            const [picLon, picLat] = picFeature.flatCoordinates_;

            const oldFeature = this.layerArrowHeadingSource.getFeatures()?.[0];
            if (oldFeature) {
                this.layerArrowHeadingSource.removeFeature(oldFeature);
            }

            this.layerArrowHeadingSource.addFeature(new lizMap.ol.Feature({
                geometry: new lizMap.ol.geom.Point([picLon, picLat])
            }));

            lizMap.mainLizmap.map.getView().animate({
                center: [picLon, picLat],
                duration: 750,                       
            });
            
            const azimuth = picFeature.getProperties?.()?.heading ?? 0;
            const r = azimuth * (Math.PI/180);
            this.layerArrowHeading.getStyle().getImage().setRotation(r);
            this.layerArrowHeading.changed();
        }
    
    
        /**
         * Init all the method
         */
        initPanoramaxDock(){
            if(!this.panoramaxDockOpen){
                // Vérifier que popup existe avant d'y accéder
                if (lizMap?.mainLizmap?.popup) {
                    lizMap.mainLizmap.popup.active = false;
                }
                this.panoramaxDockOpen = true;
                
                // Charger et enregistrer les couches VectorTile
                if (!this.panoramaxVectorLayers) {
                    this.panoramaxVectorLayers = this.#addPanoramaxVectorLayers();
                }
                
                // Afficher les couches
                this.#setPanoramaxLayersVisibility(true);
                
                // Ajouter les couches flèche de direction
                this.#addPanoramaxHeadingLayer();
                
                // Attendre que le DOM soit prêt
                setTimeout(() => {
                    this.#addPanoramaxViewer();
                    this.#addPanoramaxLayerClickEvent();
                }, 100);
            }
        }
    
        /**
         * Add Panoramax Viewer 
         */
        async #addPanoramaxViewer(){
            const viewerElement = document.querySelector('#panoramax_dock_content pnx-photo-viewer');         
            if (!viewerElement) {
                if (DEBUG_MODE) console.error("Viewer element not found");
                return;
            }
            // Attendre que le Photo Sphere Viewer soit vraiment prêt
            try {
                await viewerElement.oncePSVReady();
            } catch (error) {
                console.error('Viewer initialization failed:', error);
                return; // ou afficher message utilisateur
            }
                        
            // Réinitialiser le composant    
            this.panoViewer = viewerElement;
            this.panoViewer.select(null, null, false);            
            this.#addPanoramaxViewerEvent();
        }
    
        /**
         * Add all Panoramax Viewer Events
         */
        #addPanoramaxViewerEvent(){
            this.panoViewerListeners['psv:view-rotated'] = (e) => {                
                if(e.detail?.x){
                    const azimuth = e.detail.x ?? 0; // Valeur par défaut            
                    let r = azimuth * (Math.PI/180); 
                    this.layerArrowHeading.getStyle().getImage().setRotation(r);
                    this.layerArrowHeading.changed();
                }
            };
            this.panoViewer.addEventListener('psv:view-rotated', this.panoViewerListeners['psv:view-rotated']);
        }
    

        /**
         * Remove all Panoramax Viewer Events
         */
        #removePanoramaxViewerEvent(){
            if(!this.panoViewer) return;

            Object.keys(this.panoViewerListeners).forEach(eventName => {
                if(this.panoViewerListeners[eventName]){
                    this.panoViewer.removeEventListener(eventName, this.panoViewerListeners[eventName]);
                    this.panoViewerListeners[eventName] = null;
                }
            });
        } 

    
        /**
         * Remove all Panoramax object and instance
         */
        removePanoramaxDock(){      
            this.panoramaxDockOpen = false;
            lizMap.mainLizmap.popup.active = true;

            // Remove all event listeners
            this.#removePanoramaxLayerClickEvent();
            this.#removePanoramaxViewerEvent();
            
            // Clear heading layer
            this.layerArrowHeadingSource.clear();

            // Hide Vector Tile layers
            this.#setPanoramaxLayersVisibility(false);

            // Cleanup Panoramax viewer
            if (this.panoViewer) {
                this.panoViewer.psv?.stopSequence?.();
                const panoViewer = document.querySelector('#panoramax_dock_content pnx-photo-viewer');
                if(panoViewer){
                    panoViewer.remove();
                    document.querySelector("#panoramax_dock_content").insertAdjacentHTML('beforeend', PHOTO_VIEWER);    
                }
                this.panoViewer = null;
            }
        }
    }
    
    /**
     * Lizmap event
     */
    let lizPanoramax;

    lizMap.events.on({
        'uicreated': function(e) {
            lizPanoramax = new LizPanoramax();     
        }, 
    
        //MINI DOCK
        'minidockopened': e => {
            if (e.id === DOCK_ID && lizPanoramax) {   
                lizPanoramax.initPanoramaxDock();               
            }
        },
        'minidockclosed': e => {
            if (e.id === DOCK_ID && lizPanoramax) {
                lizPanoramax.removePanoramaxDock();            
            }
        },
    
        //DOCK
        'dockopened': e => {
            if (e.id === DOCK_ID && lizPanoramax) {   
                lizPanoramax.initPanoramaxDock();               
            }
        },
        'dockclosed': e => {
            if (e.id === DOCK_ID && lizPanoramax) {
                lizPanoramax.removePanoramaxDock();            
            }
        },
    });

    return {
        'id': DOCK_ID,
        'title': DOCK_TITLE,
    }

}();