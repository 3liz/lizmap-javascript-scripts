/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

/**
 * Lizmap Extras: GeoTIFF Export & External WMS Loader
 */
(function () {
    'use strict';

    function loadGeoTIFF() {
        return new Promise(function (resolve, reject) {
            if (window.GeoTIFF && typeof window.GeoTIFF.writeArrayBuffer === 'function') {
                resolve(window.GeoTIFF); return;
            }
            const existingScript = document.querySelector('script[data-lizmap-geotiff="true"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(window.GeoTIFF));
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/geotiff';
            script.async = true;
            script.dataset.lizmapGeotiff = 'true';
            script.onload = () => resolve(window.GeoTIFF);
            script.onerror = () => reject(new Error('Could not load GeoTIFF.js.'));
            document.head.appendChild(script);
        });
    }

    lizMap.events.on({
        'uicreated': function () {
            const olMap = window.lizMap && window.lizMap.mainLizmap && window.lizMap.mainLizmap.map;
            if (!olMap) return;

            document.getElementById('lizmap-export-panel-custom')?.remove();
            document.getElementById('lizmap-reopen-btn')?.remove();

            // =====================================================
            // STATE VARIABLES (Moved up to avoid Temporal Dead Zone)
            // =====================================================
            let legendScale = 1;
            let wmsServiceTitle = 'External WMS';
            let wmsLayerTitles = {}; 
            let addedWmsLayers = []; 
            let activeLayerId = null;
            let existingExternalGroups = {};

            // =====================================================
            // CREATE FLOATING WINDOW
            // =====================================================
            const panel = document.createElement('div');
            panel.id = 'lizmap-export-panel-custom';
            Object.assign(panel.style, {
                position: 'fixed', top: '85px', right: '60px', zIndex: '10000', width: '290px',
                background: '#ffffff', borderRadius: '9px', boxShadow: '0 5px 20px rgba(0,0,0,0.22)',
                fontFamily: '"Helvetica Neue", Arial, sans-serif', border: '1px solid #d9e0e5',
                overflow: 'hidden', userSelect: 'none'
            });

            // Header
            const header = document.createElement('div');
            Object.assign(header.style, {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', background: '#365b71', color: '#ffffff', cursor: 'move'
            });
            const title = document.createElement('div');
            title.innerHTML = '<i class="fa fa-map-o"></i> Lizmap Extras';
            Object.assign(title.style, { fontSize: '13px', fontWeight: 'bold', pointerEvents: 'none' });
            header.appendChild(title);

            const windowControls = document.createElement('div');
            Object.assign(windowControls.style, { display: 'flex', gap: '5px', alignItems: 'center' });
            const createBtn = (txt, tip) => {
                const b = document.createElement('button'); b.innerHTML = txt; b.title = tip;
                Object.assign(b.style, { width: '23px', height: '23px', padding: '0', border: 'none', borderRadius: '4px', background: 'rgba(255,255,255,0.15)', color: '#ffffff', cursor: 'pointer', fontSize: '16px', lineHeight: '20px' });
                b.addEventListener('mouseover', () => b.style.background = 'rgba(255,255,255,0.3)');
                b.addEventListener('mouseout', () => b.style.background = 'rgba(255,255,255,0.15)');
                return b;
            };
            const btnMin = createBtn('−', 'Minimize');
            const btnClose = createBtn('×', 'Close');
            windowControls.appendChild(btnMin);
            windowControls.appendChild(btnClose);
            header.appendChild(windowControls);
            panel.appendChild(header);

            // Content
            const content = document.createElement('div');
            Object.assign(content.style, { padding: '14px' });

            // --- GEOTIFF SECTION ---
            const infoExport = document.createElement('div');
            infoExport.innerText = 'Export Map (GeoTIFF)';
            Object.assign(infoExport.style, { fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '8px' });
            content.appendChild(infoExport);

            const dpiSelect = document.createElement('select');
            ['150', '200', '300'].forEach(v => {
                const o = document.createElement('option'); o.value = v; o.textContent = v + ' DPI'; dpiSelect.appendChild(o);
            });
            dpiSelect.value = '150';
            Object.assign(dpiSelect.style, { width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' });
            content.appendChild(dpiSelect);

            const btnGeoTIFF = document.createElement('button');
            btnGeoTIFF.innerHTML = '<i class="fa fa-file-image-o"></i> Export GeoTIFF';
            Object.assign(btnGeoTIFF.style, { width: '100%', padding: '8px', background: '#43718c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' });
            btnGeoTIFF.addEventListener('mouseover', () => { if (!btnGeoTIFF.disabled) btnGeoTIFF.style.background = '#365b71'; });
            btnGeoTIFF.addEventListener('mouseout', () => { if (!btnGeoTIFF.disabled) btnGeoTIFF.style.background = '#43718c'; });
            content.appendChild(btnGeoTIFF);

            // --- WMS SECTION ---
            const hr = document.createElement('hr');
            Object.assign(hr.style, { border: '0', borderTop: '1px solid #eee', margin: '10px 0' });
            content.appendChild(hr);

            const infoWms = document.createElement('div');
            infoWms.innerText = 'Add External WMS Layer';
            Object.assign(infoWms.style, { fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '8px' });
            content.appendChild(infoWms);

            const inputUrl = document.createElement('input');
            inputUrl.type = 'text';
            inputUrl.placeholder = 'WMS URL (e.g., https://...)';
            Object.assign(inputUrl.style, { width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '11px' });
            content.appendChild(inputUrl);

            const inputManualLayer = document.createElement('input');
            inputManualLayer.type = 'text';
            inputManualLayer.placeholder = 'Layer Name (if Read Layers fails)';
            Object.assign(inputManualLayer.style, { width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '11px' });
            content.appendChild(inputManualLayer);

            const btnLoadWms = document.createElement('button');
            btnLoadWms.innerHTML = '<i class="fa fa-search"></i> Read Layers';
            Object.assign(btnLoadWms.style, { width: '100%', padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '8px', fontSize: '12px' });
            content.appendChild(btnLoadWms);

            const selectLayers = document.createElement('select');
            Object.assign(selectLayers.style, { display: 'none', width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' });
            content.appendChild(selectLayers);

            const btnAddWms = document.createElement('button');
            btnAddWms.innerHTML = '<i class="fa fa-plus"></i> Add to Map';
            Object.assign(btnAddWms.style, { display: 'none', width: '100%', padding: '8px', background: '#43718c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' });
            btnAddWms.addEventListener('mouseover', () => { btnAddWms.style.background = '#365b71'; });
            btnAddWms.addEventListener('mouseout', () => { btnAddWms.style.background = '#43718c'; });
            content.appendChild(btnAddWms);

            // --- LEGEND PREVIEW SECTION ---
            const legendContainer = document.createElement('div');
            Object.assign(legendContainer.style, { display: 'none', marginTop: '10px', padding: '5px', background: '#ffffff', border: '1px solid #ccc', borderRadius: '4px' });
            
            const legendHeader = document.createElement('div');
            Object.assign(legendHeader.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' });
            
            const legendTitle = document.createElement('div');
            legendTitle.innerHTML = '<i class="fa fa-search-plus"></i> Legend (scroll to zoom)'; 
            Object.assign(legendTitle.style, { fontSize: '11px', color: '#555', fontWeight: 'bold' });
            legendHeader.appendChild(legendTitle);

            const legendControls = document.createElement('div');
            const btnZoomIn = document.createElement('button');
            btnZoomIn.innerHTML = '+'; btnZoomIn.title = 'Zoom In';
            const btnZoomOut = document.createElement('button');
            btnZoomOut.innerHTML = '−'; btnZoomOut.title = 'Zoom Out';
            const btnZoomReset = document.createElement('button');
            btnZoomReset.innerHTML = '↺'; btnZoomReset.title = 'Reset';

            [btnZoomIn, btnZoomOut, btnZoomReset].forEach(b => {
                Object.assign(b.style, { width: '20px', height: '20px', padding: '0', border: '1px solid #ccc', background: '#f8f9fa', cursor: 'pointer', borderRadius: '3px', marginLeft: '3px', fontSize: '12px', fontWeight: 'bold' });
            });
            legendControls.appendChild(btnZoomIn);
            legendControls.appendChild(btnZoomOut);
            legendControls.appendChild(btnZoomReset);
            legendHeader.appendChild(legendControls);
            legendContainer.appendChild(legendHeader);

            const legendBox = document.createElement('div');
            Object.assign(legendBox.style, { width: '100%', height: '150px', overflow: 'auto', border: '1px solid #eee', background: '#fafafa', position: 'relative', cursor: 'zoom-in' });
            legendContainer.appendChild(legendBox);

            const legendImg = document.createElement('img');
            Object.assign(legendImg.style, { display: 'block', transformOrigin: '0 0', transition: 'transform 0.1s ease-out' });
            
            legendImg.onerror = function() {
                this.style.display = 'none';
                legendTitle.innerText = 'Legend not available';
                legendControls.style.display = 'none';
            };
            
            legendImg.onload = function() {
                this.style.display = 'block';
                legendTitle.innerHTML = '<i class="fa fa-search-plus"></i> Legend (scroll to zoom)';
                legendControls.style.display = 'block';
                updateLegendTransform(); 
            };
            
            legendBox.appendChild(legendImg);
            content.appendChild(legendContainer);

            function updateLegendTransform() {
                if (legendImg.naturalWidth === 0) return;
                legendImg.style.transform = `scale(${legendScale})`;
                legendImg.style.width = (legendImg.naturalWidth * legendScale) + 'px';
                legendImg.style.height = 'auto'; 
            }

            function zoomAtPoint(newScale, mouseX, mouseY) {
                const oldScale = legendScale; // Fix: Save old scale before updating
                const rect = legendBox.getBoundingClientRect();
                const scrollLeft = legendBox.scrollLeft;
                const scrollTop = legendBox.scrollTop;
                
                legendScale = newScale;
                updateLegendTransform();
                
                if (mouseX !== undefined && mouseY !== undefined) {
                    const imgX = mouseX - rect.left + scrollLeft;
                    const imgY = mouseY - rect.top + scrollTop;
                    
                    const ratio = newScale / oldScale; // Fix: Use oldScale
                    legendBox.scrollLeft = Math.max(0, (imgX * ratio) - (mouseX - rect.left));
                    legendBox.scrollTop = Math.max(0, (imgY * ratio) - (mouseY - rect.top));
                } else {
                    legendBox.scrollLeft = scrollLeft;
                    legendBox.scrollTop = scrollTop;
                }
            }

            btnZoomIn.addEventListener('click', () => { zoomAtPoint(legendScale + 0.2); });
            btnZoomOut.addEventListener('click', () => { zoomAtPoint(Math.max(0.2, legendScale - 0.2)); });
            btnZoomReset.addEventListener('click', () => { 
                legendScale = 1; 
                updateLegendTransform(); 
                legendBox.scrollTop = 0; 
                legendBox.scrollLeft = 0;
                legendBox.style.cursor = 'zoom-in';
                
                const selected = addedWmsLayers.find(l => l.id === activeLayerId);
                if (selected) {
                    selected.scale = 1;
                    selected.scrollTop = 0;
                    selected.scrollLeft = 0;
                }
            });

            legendBox.addEventListener('wheel', (e) => {
                e.preventDefault(); 
                const delta = Math.sign(e.deltaY); 
                let newScale = legendScale + (delta < 0 ? 0.2 : -0.2);
                newScale = Math.max(0.2, newScale);
                
                const ratio = newScale / legendScale;
                const rect = legendBox.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const imgX = mouseX + legendBox.scrollLeft;
                const imgY = mouseY + legendBox.scrollTop;

                legendScale = newScale;
                updateLegendTransform();

                legendBox.scrollLeft = Math.max(0, imgX * ratio - mouseX);
                legendBox.scrollTop = Math.max(0, imgY * ratio - mouseY);
                
                const selected = addedWmsLayers.find(l => l.id === activeLayerId);
                if (selected) {
                    selected.scale = legendScale;
                    selected.scrollTop = legendBox.scrollTop;
                    selected.scrollLeft = legendBox.scrollLeft;
                }
            }, { passive: false });

            // --- OPACITY CONTROL SECTION ---
            const opacityContainer = document.createElement('div');
            Object.assign(opacityContainer.style, { display: 'none', marginTop: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #eee' });
            
            const opacityHeader = document.createElement('div');
            Object.assign(opacityHeader.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' });
            
            const opacityLabel = document.createElement('label');
            opacityLabel.innerHTML = 'Layer Opacity: <span id="opacity-val">100%</span>';
            Object.assign(opacityLabel.style, { fontSize: '11px', color: '#555', fontWeight: 'bold' });
            opacityHeader.appendChild(opacityLabel);

            // Clear All Button
            const btnClearAll = document.createElement('button');
            btnClearAll.innerHTML = '<i class="fa fa-trash"></i> Clear';
            btnClearAll.title = 'Remove all external layers';
            Object.assign(btnClearAll.style, { 
                padding: '2px 6px', fontSize: '10px', background: '#dc3545', color: '#fff', 
                border: 'none', borderRadius: '3px', cursor: 'pointer' 
            });
            btnClearAll.addEventListener('mouseover', () => btnClearAll.style.background = '#c82333');
            btnClearAll.addEventListener('mouseout', () => btnClearAll.style.background = '#dc3545');
            opacityHeader.appendChild(btnClearAll);

            opacityContainer.appendChild(opacityHeader);

            const layerListDiv = document.createElement('div');
            Object.assign(layerListDiv.style, { maxHeight: '80px', overflowY: 'auto', marginBottom: '8px', fontSize: '11px', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' });
            opacityContainer.appendChild(layerListDiv);

            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0';
            opacitySlider.max = '1';
            opacitySlider.step = '0.05';
            opacitySlider.value = '1';
            Object.assign(opacitySlider.style, { width: '100%', cursor: 'pointer', margin: '0' });
            opacityContainer.appendChild(opacitySlider);
            
            content.appendChild(opacityContainer);

            panel.appendChild(content);
            document.body.appendChild(panel);

            // Reopen Button
            const btnReopen = document.createElement('button');
            btnReopen.id = 'lizmap-reopen-btn';
            btnReopen.innerHTML = '<i class="fa fa-map-o"></i>';
            btnReopen.title = 'Open Lizmap Extras';
            
            Object.assign(btnReopen.style, { 
                position: 'fixed', 
                top: '85px', 
                right: '60px', 
                zIndex: '10000', 
                width: '43px', 
                height: '43px', 
                borderRadius: '50%', 
                border: 'none', 
                background: '#365b71', 
                color: '#fff', 
                fontSize: '18px', 
                cursor: 'pointer', 
                boxShadow: '0 3px 12px rgba(0,0,0,0.25)', 
                display: 'none',
                transition: 'transform 0.1s ease'
            });
            
            btnReopen.addEventListener('mouseover', () => {
                btnReopen.style.transform = 'scale(1.1)';
                btnReopen.style.background = '#43718c';
            });
            btnReopen.addEventListener('mouseout', () => {
                btnReopen.style.transform = 'scale(1)';
                btnReopen.style.background = '#365b71';
            });
            
            document.body.appendChild(btnReopen);

            const hide = () => { 
                const rect = panel.getBoundingClientRect();
                const rightOffset = window.innerWidth - rect.right;
                btnReopen.style.top = rect.top + 'px';
                btnReopen.style.left = 'auto';
                btnReopen.style.right = rightOffset + 'px';
                
                panel.style.display = 'none'; 
                btnReopen.style.display = 'block'; 
            };
            
            btnMin.addEventListener('click', hide);
            btnClose.addEventListener('click', hide);
            btnReopen.addEventListener('click', () => { 
                panel.style.display = 'block'; 
                btnReopen.style.display = 'none'; 
            });

            // Drag
            let dragging = false, startX, startY, posX, posY;
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                dragging = true; const rect = panel.getBoundingClientRect();
                startX = e.clientX; startY = e.clientY; posX = rect.left; posY = rect.top;
                panel.style.right = 'auto'; panel.style.bottom = 'auto'; e.preventDefault();
            });
            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                panel.style.left = Math.max(0, Math.min(posX + e.clientX - startX, window.innerWidth - panel.offsetWidth)) + 'px';
                panel.style.top = Math.max(0, Math.min(posY + e.clientY - startY, window.innerHeight - panel.offsetHeight)) + 'px';
            });
            document.addEventListener('mouseup', () => dragging = false);

            // =====================================================
            // WMS LOGIC
            // =====================================================
            btnLoadWms.addEventListener('click', async () => {
                let url = inputUrl.value.trim();
                if (!url) { alert('Please enter a URL.'); return; }
                if (url.includes('?')) url = url.split('?')[0];
                const capabilitiesUrl = url + '?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0';

                btnLoadWms.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Reading...';
                wmsLayerTitles = {}; 
                
                try {
                    const response = await fetch(capabilitiesUrl);
                    if (!response.ok) throw new Error('Server error: ' + response.status);
                    const text = await response.text();
                    const xmlDoc = new DOMParser().parseFromString(text, 'text/xml');
                    
                    const serviceTitleNode = xmlDoc.querySelector('Service > Title');
                    if (serviceTitleNode && serviceTitleNode.textContent.trim() !== '') {
                        wmsServiceTitle = serviceTitleNode.textContent.trim();
                    } else {
                        wmsServiceTitle = new URL(url).hostname;
                    }

                    const allLayerNodes = xmlDoc.querySelectorAll('Layer'); 
                    
                    if (allLayerNodes.length === 0) throw new Error('No layers found.');

                    selectLayers.innerHTML = '';
                    let validLayersCount = 0;

                    allLayerNodes.forEach(node => {
                        const nameNode = node.querySelector(':scope > Name');
                        
                        if (nameNode) {
                            const name = nameNode.textContent.trim();
                            const titleNode = node.querySelector(':scope > Title');
                            const title = titleNode ? titleNode.textContent.trim() : name;

                            wmsLayerTitles[name] = title;

                            const opt = document.createElement('option');
                            opt.value = name;
                            opt.textContent = title;
                            selectLayers.appendChild(opt);
                            validLayersCount++;
                        }
                    });

                    if (validLayersCount === 0) throw new Error('No valid layers found.');

                    selectLayers.style.display = 'block';
                    btnAddWms.style.display = 'block';
                    btnLoadWms.innerHTML = '<i class="fa fa-search"></i> Read Layers';

                } catch (error) {
                    console.warn('CORS/Network Error:', error);
                    alert('Could not read layers automatically.\nYou can still type the Layer ID manually.');
                    selectLayers.style.display = 'none';
                    btnAddWms.style.display = 'block'; 
                    btnLoadWms.innerHTML = '<i class="fa fa-search"></i> Read Layers';
                    inputUrl.value = '';
                    inputManualLayer.value = '';
                }
            });

            function updateLayerList() {
                layerListDiv.innerHTML = '';
                addedWmsLayers.forEach(layerObj => {
                    const label = document.createElement('label');
                    Object.assign(label.style, { display: 'flex', alignItems: 'center', marginBottom: '3px', cursor: 'pointer' });
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'activeLayerSelect';
                    radio.value = layerObj.id;
                    radio.checked = (activeLayerId === layerObj.id);
                    radio.style.marginRight = '6px';
                    
                    radio.addEventListener('change', () => {
                        activeLayerId = layerObj.id;
                        const selected = addedWmsLayers.find(l => l.id === layerObj.id);
                        if (selected) {
                            opacitySlider.value = selected.layer.getOpacity();
                            document.getElementById('opacity-val').innerText = Math.round(selected.layer.getOpacity() * 100) + '%';
                            
                            if (selected.legendUrl) {
                                legendImg.src = selected.legendUrl;
                                legendContainer.style.display = 'block';
                                legendScale = selected.scale || 1;
                                updateLegendTransform(); 
                                
                                // Fix: Use a temporary listener instead of overwriting onload
                                const onLegendLoad = function() {
                                    this.style.display = 'block';
                                    legendTitle.innerHTML = '<i class="fa fa-search-plus"></i> Legend (scroll to zoom)';
                                    legendControls.style.display = 'block';
                                    updateLegendTransform(); 
                                    legendBox.scrollLeft = selected.scrollLeft || 0;
                                    legendBox.scrollTop = selected.scrollTop || 0;
                                    legendImg.removeEventListener('load', onLegendLoad);
                                };
                                
                                if (legendImg.complete) {
                                    onLegendLoad.call(legendImg);
                                } else {
                                    legendImg.addEventListener('load', onLegendLoad);
                                }
                            } else {
                                legendContainer.style.display = 'none';
                            }
                        }
                    });

                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(layerObj.title.length > 25 ? layerObj.title.substring(0,25)+'...' : layerObj.title));
                    layerListDiv.appendChild(label);
                });
            }

            btnAddWms.addEventListener('click', () => {
                const layerId = selectLayers.style.display !== 'none' 
                                    ? selectLayers.value 
                                    : inputManualLayer.value.trim();
                
                if (!layerId) { alert('Please specify a Layer Name.'); return; }
                
                let url = inputUrl.value.trim();
                if (url.includes('?')) url = url.split('?')[0];

                try {
                    let groupName = wmsServiceTitle;
                    if (groupName.length > 40) groupName = groupName.substring(0, 37) + '...';
                    
                    if (selectLayers.style.display === 'none' && groupName === 'External WMS') {
                        groupName = new URL(url).hostname; 
                    }

                    let extGroup;
                    if (existingExternalGroups[groupName]) {
                        extGroup = existingExternalGroups[groupName];
                    } else {
                        extGroup = lizMap.mainLizmap.state.rootMapGroup.createExternalGroup(groupName);
                        existingExternalGroups[groupName] = extGroup;
                    }
                    
                    const layer = new lizMap.ol.layer.Image({
                        source: new lizMap.ol.source.ImageWMS({
                            url: url,
                            params: { 'LAYERS': layerId, 'VERSION': '1.3.0', 'FORMAT': 'image/png', 'TRANSPARENT': 'TRUE' }
                        })
                    });

                    const layerTitle = wmsLayerTitles[layerId] || layerId;
                    
                    let finalId = layerTitle;
                    let counter = 1;
                    while (addedWmsLayers.some(l => l.title === finalId)) {
                        finalId = layerTitle + ' (' + counter + ')';
                        counter++;
                    }

                    extGroup.addOlLayer(finalId, layer);
                    
                    if (extGroup.itemState && extGroup.itemState.setName) {
                        extGroup.itemState.setName(groupName);
                    }

                    const legendUrl = url + '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=' + encodeURIComponent(layerId) + '&FORMAT=image/png&STYLE=';

                    addedWmsLayers.push({ 
                        id: finalId, 
                        title: finalId, 
                        layer: layer, 
                        legendUrl: legendUrl,
                        scale: 1,
                        scrollLeft: 0,
                        scrollTop: 0,
                        groupName: groupName 
                    });
                    
                    activeLayerId = finalId;

                    legendImg.src = legendUrl;
                    legendContainer.style.display = 'block';
                    legendScale = 1;
                    updateLegendTransform();
                    legendBox.scrollLeft = 0;
                    legendBox.scrollTop = 0;

                    opacityContainer.style.display = 'block';
                    opacitySlider.value = '1';
                    document.getElementById('opacity-val').innerText = '100%';
                    updateLayerList();

                    inputUrl.value = '';
                    inputManualLayer.value = '';
                    selectLayers.style.display = 'none';
                    btnAddWms.style.display = 'none';
                    
                    wmsServiceTitle = 'External WMS'; 
                } catch (err) {
                    console.error('Add Error:', err);
                    alert('Error adding WMS layer:\n' + err.message);
                }
            });

            opacitySlider.addEventListener('input', (e) => {
                const selected = addedWmsLayers.find(l => l.id === activeLayerId);
                if (selected) {
                    const val = parseFloat(e.target.value);
                    selected.layer.setOpacity(val);
                    document.getElementById('opacity-val').innerText = Math.round(val * 100) + '%';
                }
            });

            // =====================================================
            // CLEAR ALL LOGIC
            // =====================================================
            btnClearAll.addEventListener('click', () => {
                if (!confirm('Are you sure you want to remove all external layers?')) return;

                const groupsToRemove = new Set(addedWmsLayers.map(l => l.groupName));

                groupsToRemove.forEach(groupName => {
                    try {
                        lizMap.mainLizmap.state.rootMapGroup.removeExternalGroup(groupName);
                    } catch (e) {
                        console.warn('Could not remove group:', groupName, e);
                    }
                });

                addedWmsLayers = [];
                activeLayerId = null;
                existingExternalGroups = {}; 
                
                opacityContainer.style.display = 'none';
                layerListDiv.innerHTML = '';
                legendContainer.style.display = 'none';
                legendImg.src = '';
                inputUrl.value = '';
                inputManualLayer.value = '';
                selectLayers.style.display = 'none';
                btnAddWms.style.display = 'none';
                btnLoadWms.innerHTML = '<i class="fa fa-search"></i> Read Layers';
                
                olMap.renderSync();
                
                console.log('All external WMS layers cleared.');
            });

            // =====================================================
            // GEOTIFF LOGIC
            // =====================================================
            btnGeoTIFF.addEventListener('click', async function (evt) {
                evt.preventDefault(); btnGeoTIFF.disabled = true;

                try {
                    const GeoTIFF = await loadGeoTIFF();
                    const view = olMap.getView();
                    const size = olMap.getSize();
                    const extent = view.calculateExtent(size);
                    const proj = view.getProjection().getCode();

                    const vp = document.querySelector('.ol-viewport');
                    const canvas = vp.querySelector('canvas');
                    
                    const copy = document.createElement('canvas');
                    copy.width = canvas.width; copy.height = canvas.height;
                    const ctxCopy = copy.getContext('2d');
                    ctxCopy.drawImage(canvas, 0, 0);

                    try {
                        ctxCopy.getImageData(0, 0, 1, 1);
                    } catch (e) {
                        alert(
                            'Unable to export with the current map.\n\n' +
                            'The browser blocks pixel reading (CORS) when the map includes layers from external servers that do not send the required security headers.\n\n' +
                            'This can happen with basemaps like Google, OpenStreetMap, Bing, or with any external WMS layer you have added.\n\n' +
                            'To export, please temporarily disable the problematic layers and use only the WMS from your own project (QGIS Server).'
                        );
                        return;
                    }

                    const dpi = parseInt(dpiSelect.value, 10);
                    const factor = dpi / 96;
                    const newW = Math.round(copy.width * factor);
                    const newH = Math.round(copy.height * factor);

                    const highRes = document.createElement('canvas');
                    highRes.width = newW; highRes.height = newH;
                    const ctxHigh = highRes.getContext('2d');
                    ctxHigh.imageSmoothingEnabled = true; ctxHigh.imageSmoothingQuality = 'high';
                    ctxHigh.drawImage(copy, 0, 0, newW, newH);

                    const imgData = ctxHigh.getImageData(0, 0, newW, newH);
                    const rgb = new Uint8Array(newW * newH * 3);
                    for (let i = 0; i < newW * newH; i++) {
                        rgb[i * 3] = imgData.data[i * 4];
                        rgb[i * 3 + 1] = imgData.data[i * 4 + 1];
                        rgb[i * 3 + 2] = imgData.data[i * 4 + 2];
                    }

                    const resX = (extent[2] - extent[0]) / newW;
                    const resY = (extent[3] - extent[1]) / newH;

                    const metadata = {
                        width: newW, height: newH, SamplesPerPixel: 3, PhotometricInterpretation: 2,
                        PlanarConfiguration: 1, BitsPerSample: [8, 8, 8], SampleFormat: [1, 1, 1],
                        ModelPixelScale: [resX, resY, 0], ModelTiepoint: [0, 0, 0, extent[0], extent[3], 0], GTRasterTypeGeoKey: 1
                    };

                    const epsgMatch = proj.match(/EPSG:(\d+)/i);
                    if (epsgMatch) {
                        const epsg = parseInt(epsgMatch[1], 10);
                        metadata.GTModelTypeGeoKey = (epsg === 4326 || epsg === 4258) ? 2 : 1;
                        if (metadata.GTModelTypeGeoKey === 2) metadata.GeographicTypeGeoKey = epsg;
                        else metadata.ProjectedCSTypeGeoKey = epsg;
                    }

                    const arrayBuffer = await GeoTIFF.writeArrayBuffer(rgb, metadata);
                    const blob = new Blob([arrayBuffer], { type: 'image/tiff' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url; link.download = 'lizmap_georef.tif';
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);

                } catch (error) {
                    console.error('GeoTIFF error:', error);
                    alert('GeoTIFF error:\n' + error.message);
                } finally {
                    btnGeoTIFF.disabled = false;
                }
            });

            console.log('Lizmap Extras loaded successfully.');
        }
    });
})();
