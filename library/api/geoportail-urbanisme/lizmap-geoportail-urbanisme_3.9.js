/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

const lizmapGetDocGU = function() {

    const DEBUG_MODE = false; // Set to false in production
    const DISPLAY_MODE = 'popup'; // 'popup' or 'dock'

    // IF DISPLAY_MODE = 'popup'
    // Layer ID - used to check if the opened popup is the good one
    // You must change this value with the one of your layer, 
    // you can find it in QGIS
    const LIZMAP_LAYER = "identifiant_unique_de_ma_couche"; //ex. Communes_c627fe50_9b56_4fc3_96bf_381287dbd664 
    // Si DOM_DOCUMENTS_ID est null alors les documents seront par défaut ajoutés à la fin du popup
    // sinon préciser un id de div existante dans le DOM du popup (à créer dans QGIS)
    const DOM_DOCUMENTS_ID = null; // 'ex. documents-gu'


    //IF DISPLAY_MODE = 'dock'
    const DOCK_ID       = 'getdocgu';
    const DOCK_ICON     = 'icon-file';
    const DOCK_POSITION = 'dock'; // 'dock' | 'minidock'
    const DOCK_TITLE    = 'Documents réglementaires';

    /** ********************************
     ###################################
        DO NOT MODIFY BELOW THIS LINE
     ###################################
     ******************************** */
    const LIZMAP_POPUP = "#popupcontent .lizmapPopupContent .lizmapPopupSingleFeature";
    const MSG_WAITING   = "En attente du Géoportail de l'urbanisme...";
    const MSG_CLICK_MAP = "Cliquez sur une parcelle de la carte pour afficher les documents réglementaires.";
    const TIMEOUT = 5000;
    
    
    class LizGetDocGU{
        constructor(){
            // Initialize state
            this._lastClickCoord = null;
            this._dockOpen = false;
            this._loading = false;

            const _map = lizMap.mainLizmap?.map;
            if (!_map) return;

            this._boundOnMapClick = this.#onMapClick.bind(this);
            _map.on('singleclick', this._boundOnMapClick);

            if (DISPLAY_MODE === 'dock') this.#addDock();
        }

        #initPopupDOM(){            
            const container = DOM_DOCUMENTS_ID
                ? document.getElementById(DOM_DOCUMENTS_ID)
                : document.querySelector(LIZMAP_POPUP);           
            
            if (!container) return null;
            // Vérification de la couche uniquement en mode popup
            if (!DOM_DOCUMENTS_ID && container.getAttribute('data-layer-id') !== LIZMAP_LAYER) return null;
            
            if (!container.querySelector('#info-gpu')) {
                container.insertAdjacentHTML('beforeend', `
                    <div id="info-gpu"></div>
                    <div id="liste-docs-reglementaires" class="accordion"></div>
                `);
            }
            return {
                divInfoGPU: container.querySelector('#info-gpu'),
                divListDoc: container.querySelector('#liste-docs-reglementaires')
            };
        }

        #initDockDOM(){
            const container = document.querySelector(`#${DOCK_ID}-content`);
            if (!container) return null;
            return {
                divInfoGPU: container.querySelector(`#${DOCK_ID}-info`),
                divListDoc: container.querySelector(`#${DOCK_ID}-list`)
            };
        }

        #initDOM() {
            if (DISPLAY_MODE === 'popup') return this.#initPopupDOM();
            if (DISPLAY_MODE === 'dock')  return this.#initDockDOM();
        }

        #addDock(){
            lizMap.addDock(
                DOCK_ID,
                DOCK_TITLE,
                DOCK_POSITION,
                `<div id="${DOCK_ID}-content">
                    <p id="${DOCK_ID}-info">${MSG_CLICK_MAP}</p>
                    <div id="${DOCK_ID}-list" class="accordion"></div>
                </div>`,
                DOCK_ICON
            );
        }

        #resetDock(){
            const info = document.querySelector(`#${DOCK_ID}-info`);
            const list = document.querySelector(`#${DOCK_ID}-list`);
            if (info) info.textContent = MSG_CLICK_MAP;
            if (list) list.innerHTML = '';
        }

        openDock(){ 
            if (lizMap?.mainLizmap?.popup) lizMap.mainLizmap.popup.active = false;
            this._dockOpen = true; 
        }

        closeDock(){ 
            if (lizMap?.mainLizmap?.popup) lizMap.mainLizmap.popup.active = true;
            this._dockOpen = false; 
            this.#resetDock(); 
        }

        #onMapClick(event){
            const point = new lizMap.ol.geom.Point(event.coordinate);
            
            // Détection de la projection courante selon la version
            const currentProj = lizMap.mainLizmap?.map?.getView()?.getProjection()?.getCode();
            if (!currentProj) return;

            try {
                if (currentProj !== 'EPSG:4326') {
                    point.transform(currentProj, 'EPSG:4326');
                }
            } catch(e) {
                if (DEBUG_MODE) console.error('Erreur de projection :', e);
                return;
            }

            this._lastClickCoord = {
                lon: point.getCoordinates()[0].toFixed(6),
                lat: point.getCoordinates()[1].toFixed(6)
            };    
            
            if (DISPLAY_MODE === 'dock' && this._dockOpen) {
                this.getDocGU();
            }
        }

        async #getCodeInseeGeoAPI(signal){
            if (!this._lastClickCoord) return;

            const url = `https://geo.api.gouv.fr/communes?lon=${this._lastClickCoord.lon}&lat=${this._lastClickCoord.lat}&fields=code&format=json`
            
            const geoResponse = await fetch(url, { signal: signal });
            if (!geoResponse.ok) throw new Error('Erreur de communication avec l\'API géographique.');
            
            const geoData = await geoResponse.json();
            if (Array.isArray(geoData) && geoData.length > 0) {
                const codeInsee = geoData[0]?.code;
                if (DEBUG_MODE) console.log('Code INSEE depuis API :', codeInsee);
                return codeInsee;
            }
            return null;                                
        }

        #escapeHtml(str){
            return (str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        async #fetchDocumentId(codeInsee, signal){
            // Récupération de l'ID du document
            const response = await fetch(
                `https://www.geoportail-urbanisme.gouv.fr/api/document?partition=DU_${encodeURIComponent(codeInsee)}&status=document.production`
                ,{ signal: signal }
            );
            if (!response.ok) throw new Error('Erreur de communication avec le GPU.');

            const data = await response.json();
            if (!Array.isArray(data) || !data.length) throw new Error('Aucun document réglementaire disponible sur le GPU.');
            if (!data[0].id) throw new Error('Document GPU introuvable.');
            return data[0].id;            
        }

        async #fetchDocumentFiles(docId, signal){            
            // Récupération des fichiers                        
            const response = await fetch(
                `https://www.geoportail-urbanisme.gouv.fr/api/document/${encodeURIComponent(docId)}/files`
                ,{ signal: signal }
            );
            if (!response.ok) throw new Error('Erreur de communication avec le GPU.');

            const documents = await response.json();
            if (!Array.isArray(documents)) throw new Error('Format inattendu.');

            return documents;
        }

        #renderDocList(documents, docId, divListDoc, divInfoGPU){
            const parentId = divListDoc.id || 'liste-docs-reglementaires';
            // supprime tout ce qui n'est pas alphanumérique ou underscore
            const dataDocsDivId = documents.map(v => ({
                ...v,
                path: v.path || 'Autres',
                dom_id: (v.path || 'Autres')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9_]/g, '_')
            }));

            // Types uniques (ordre préservé)
            const docTypes = [...new Map(dataDocsDivId.map(v => [v.path, v])).values()]
                                .map((v, i) => ({ ...v, dom_id: `${v.dom_id}_${i}` }));

            // Injection dans le DOM
            divListDoc.innerHTML = '';
            divInfoGPU.innerHTML = `<p class="liz-filiation-absent">Documents réglementaires disponibles sur le GPU (${documents.length})</p>`;
            for (const docType of docTypes) {
                const docsOfType = dataDocsDivId.filter(d => d.path === docType.path);

                const liItems = docsOfType.map(doc => {
                    const url = `https://www.geoportail-urbanisme.gouv.fr/api/document/${docId}/files/${encodeURIComponent(doc.name)}`;
                    const safeTitle = this.#escapeHtml(doc.title || 'Sans titre');
                    return `<li><a class="liz-link" target="_blank" href="${url}">${safeTitle}</a></li>`;
                }).join('');

                const safePath  = this.#escapeHtml(docType.path);

                const HTML_TEMPLATE = `<div class="accordion-group">
                    <div class="accordion-heading">
                        <a class="accordion-toggle liz-link" 
                        data-toggle="collapse" 
                        data-parent="#${parentId}" 
                        href="#${docType.dom_id}">
                            ${safePath} (${docsOfType.length})
                        </a>
                    </div>
                    <div id="${docType.dom_id}" class="accordion-body collapse">
                        <div class="accordion-inner">
                            <ul class="liz-list">${liItems}</ul>
                        </div>
                    </div>
                </div>`;
                divListDoc.insertAdjacentHTML('beforeend', HTML_TEMPLATE);
            }            
        }

        async #getDocGUAPI(codeInsee, divListDoc, divInfoGPU, signal){
            const docId     = await this.#fetchDocumentId(codeInsee, signal);
            const documents = await this.#fetchDocumentFiles(docId, signal);
            this.#renderDocList(documents, docId, divListDoc, divInfoGPU);
        }

        async getDocGU(){
            if (this._loading) return;
            this._loading = true;
            this._controller = new AbortController(); 
            const timeout = setTimeout(() => this._controller.abort(), TIMEOUT);
            let divInfoGPU = null;

            try {
                const dom = this.#initDOM();
                if (!dom) return;
                divInfoGPU = dom.divInfoGPU;
                const divListDoc = dom.divListDoc;
                divInfoGPU.textContent = MSG_WAITING;
                divListDoc.innerHTML = '';

                const codeInsee = await this.#getCodeInseeGeoAPI(this._controller.signal);
                if (!codeInsee) {
                    divInfoGPU.textContent = 'Commune non identifiée. Veuillez cliquer sur la parcelle.';
                    return;
                }            
                await this.#getDocGUAPI(codeInsee, divListDoc, divInfoGPU, this._controller.signal);
            } catch(err) {
                if (DEBUG_MODE && err.name !== 'AbortError') console.error('Erreur :', err);
                if (!divInfoGPU) return;
                divInfoGPU.textContent = err.name === 'AbortError'
                    ? 'Délai dépassé. Veuillez réessayer.'
                    : err.message;
            } finally {
                clearTimeout(timeout);
                this._loading = false;
            }
        }
    }

    /**
     * Lizmap event
     */
    let lizGetDocGU;

    lizMap.events.on({	
        'uicreated': function(e) {
            lizGetDocGU = new LizGetDocGU();     
        }, 
        // Options DISPLAY_MODE = 'popup'
        'lizmappopupdisplayed': async function(e) {
            if (DISPLAY_MODE === 'popup' && lizGetDocGU) {
                await lizGetDocGU.getDocGU();
            }
        },
        // Option DISPLAY_MODE = 'dock'
        'dockopened': function(e) {
            if (DISPLAY_MODE === 'dock' && e.id === DOCK_ID && lizGetDocGU)
                lizGetDocGU.openDock();
        },
        'dockclosed': function(e) {
            if (DISPLAY_MODE === 'dock' && e.id === DOCK_ID && lizGetDocGU)
                lizGetDocGU.closeDock();
        },

        // Option DISPLAY_MODE = 'dock' ou 'minidock'
        'minidockopened': function(e) {
            if (DISPLAY_MODE === 'dock' && e.id === DOCK_ID && lizGetDocGU)
                lizGetDocGU.openDock();
        },
        'minidockclosed': function(e) {
            if (DISPLAY_MODE === 'dock' && e.id === DOCK_ID && lizGetDocGU)
                lizGetDocGU.closeDock();
        }
    })
}();
