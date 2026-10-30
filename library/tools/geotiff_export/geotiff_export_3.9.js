/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

/**
 * GeoTIFF Export Tool
 *
 * Adds a floating panel with a "Export GeoTIFF" button that exports the
 * current map view as a georeferenced GeoTIFF (.tif) file.
 *
 * Key features:
 * - WYSIWYG georeferencing (uses OpenLayers 10 view, not the legacy OL2 map)
 * - DPI selection (150 / 200 / 300) for output resolution
 * - Detects CORS-tainted canvases (Google, OpenStreetMap basemaps) and
 *   warns the user gracefully instead of throwing a SecurityError
 *
 * Compatible with Lizmap Web Client 3.9.x (OpenLayers 10).
 */
(function () {
    'use strict';

    // =====================================================
    // 1. LOAD GEOTIFF.JS LIBRARY
    // =====================================================

    function loadGeoTIFF() {
        return new Promise(function (resolve, reject) {
            if (window.GeoTIFF &&
                typeof window.GeoTIFF.writeArrayBuffer === 'function') {
                resolve(window.GeoTIFF);
                return;
            }

            const existingScript = document.querySelector(
                'script[data-lizmap-geotiff="true"]'
            );

            if (existingScript) {
                existingScript.addEventListener('load', function () {
                    if (window.GeoTIFF &&
                        typeof window.GeoTIFF.writeArrayBuffer === 'function') {
                        resolve(window.GeoTIFF);
                    } else {
                        reject(new Error('GeoTIFF.js is not available.'));
                    }
                });
                existingScript.addEventListener('error', function () {
                    reject(new Error('Could not load GeoTIFF.js.'));
                });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/geotiff';
            script.async = true;
            script.dataset.lizmapGeotiff = 'true';

            script.onload = function () {
                if (window.GeoTIFF &&
                    typeof window.GeoTIFF.writeArrayBuffer === 'function') {
                    resolve(window.GeoTIFF);
                } else {
                    reject(new Error('GeoTIFF.js is not available.'));
                }
            };
            script.onerror = function () {
                reject(new Error('Could not load GeoTIFF.js.'));
            };
            document.head.appendChild(script);
        });
    }

    // =====================================================
    // 2. INITIALIZATION
    // =====================================================

    lizMap.events.on({
        'uicreated': function () {

            const olMap = window.lizMap && window.lizMap.mainLizmap &&
                          window.lizMap.mainLizmap.map;

            if (!olMap) {
                console.error('OL10 map not found in lizMap.mainLizmap.map');
                return;
            }

            if (document.getElementById('lizmap-export-panel-custom')) {
                return;
            }

            // =================================================
            // 3. FLOATING WINDOW
            // =================================================

            const panel = document.createElement('div');
            panel.id = 'lizmap-export-panel-custom';

            Object.assign(panel.style, {
                position: 'fixed',
                top: '85px',
                right: '60px',
                zIndex: '10000',
                width: '255px',
                background: '#ffffff',
                borderRadius: '9px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.22)',
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                border: '1px solid #d9e0e5',
                overflow: 'hidden',
                userSelect: 'none'
            });

            // Header
            const header = document.createElement('div');
            Object.assign(header.style, {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#365b71',
                color: '#ffffff',
                cursor: 'move'
            });

            const title = document.createElement('div');
            title.innerHTML = '<i class="fa fa-map-o"></i> Lizmap Extras';
            Object.assign(title.style, {
                fontSize: '13px',
                fontWeight: 'bold',
                pointerEvents: 'none'
            });
            header.appendChild(title);

            const windowControls = document.createElement('div');
            Object.assign(windowControls.style, {
                display: 'flex',
                gap: '5px',
                alignItems: 'center'
            });

            function createWindowButton(text, tooltip) {
                const btn = document.createElement('button');
                btn.innerHTML = text;
                btn.title = tooltip;
                Object.assign(btn.style, {
                    width: '23px',
                    height: '23px',
                    padding: '0',
                    border: 'none',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: '20px'
                });
                btn.addEventListener('mouseover', function () {
                    btn.style.background = 'rgba(255,255,255,0.3)';
                });
                btn.addEventListener('mouseout', function () {
                    btn.style.background = 'rgba(255,255,255,0.15)';
                });
                return btn;
            }

            const btnMinimize = createWindowButton('−', 'Minimize window');
            const btnClose = createWindowButton('×', 'Close window');
            windowControls.appendChild(btnMinimize);
            windowControls.appendChild(btnClose);
            header.appendChild(windowControls);
            panel.appendChild(header);

            // Content
            const content = document.createElement('div');
            Object.assign(content.style, { padding: '14px' });

            const info = document.createElement('div');
            info.innerText = 'Export Map';
            Object.assign(info.style, {
                fontSize: '12px',
                color: '#555',
                marginBottom: '12px'
            });
            content.appendChild(info);

            // DPI
            const dpiLabel = document.createElement('label');
            dpiLabel.innerText = 'GeoTIFF Resolution';
            Object.assign(dpiLabel.style, {
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '6px',
                color: '#333'
            });

            const dpiSelect = document.createElement('select');
            dpiSelect.id = 'lizmap-geotiff-dpi';
            [
                { value: 150, label: '150 DPI - Normal' },
                { value: 200, label: '200 DPI - High' },
                { value: 300, label: '300 DPI - Very high' }
            ].forEach(function (item) {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.label;
                dpiSelect.appendChild(option);
            });
            dpiSelect.value = '150';

            Object.assign(dpiSelect.style, {
                width: '100%',
                padding: '8px',
                border: '1px solid #ccd3d8',
                borderRadius: '5px',
                background: '#ffffff',
                fontSize: '12px',
                marginBottom: '13px',
                cursor: 'pointer'
            });

            dpiLabel.appendChild(dpiSelect);
            content.appendChild(dpiLabel);

            // Button
            function applyButtonStyle(btn) {
                Object.assign(btn.style, {
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#ffffff',
                    backgroundColor: '#43718c',
                    fontSize: '12px'
                });
                btn.addEventListener('mouseover', function () {
                    if (!btn.disabled) btn.style.backgroundColor = '#365b71';
                });
                btn.addEventListener('mouseout', function () {
                    if (!btn.disabled) btn.style.backgroundColor = '#43718c';
                });
            }

            const btnGeoTIFF = document.createElement('button');
            btnGeoTIFF.innerHTML =
                '<i class="fa fa-file-image-o"></i> Export GeoTIFF (.tif)';
            btnGeoTIFF.title = 'Download TIFF with embedded georeferencing';
            applyButtonStyle(btnGeoTIFF);
            content.appendChild(btnGeoTIFF);

            panel.appendChild(content);
            document.body.appendChild(panel);

            // Reopen button
            const btnReopen = document.createElement('button');
            btnReopen.innerHTML = '<i class="fa fa-map-o"></i>';
            btnReopen.title = 'Open GIS Tools';
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
                color: '#ffffff',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
                display: 'none'
            });
            document.body.appendChild(btnReopen);

            function hidePanel() {
                panel.style.display = 'none';
                btnReopen.style.display = 'block';
            }
            btnMinimize.addEventListener('click', function (e) {
                e.stopPropagation(); hidePanel();
            });
            btnClose.addEventListener('click', function (e) {
                e.stopPropagation(); hidePanel();
            });
            btnReopen.addEventListener('click', function () {
                panel.style.display = 'block';
                btnReopen.style.display = 'none';
            });

            // Drag
            let dragging = false, startX = 0, startY = 0,
                posX = 0, posY = 0;

            header.addEventListener('mousedown', function (evt) {
                if (evt.target.closest('button')) return;
                dragging = true;
                const rect = panel.getBoundingClientRect();
                startX = evt.clientX;
                startY = evt.clientY;
                posX = rect.left;
                posY = rect.top;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                evt.preventDefault();
            });
            document.addEventListener('mousemove', function (evt) {
                if (!dragging) return;
                const newX = posX + evt.clientX - startX;
                const newY = posY + evt.clientY - startY;
                const maxX = window.innerWidth - panel.offsetWidth;
                const maxY = window.innerHeight - panel.offsetHeight;
                panel.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
                panel.style.top  = Math.max(0, Math.min(newY, maxY)) + 'px';
            });
            document.addEventListener('mouseup', function () {
                dragging = false;
            });

            // =================================================
            // 4. CAPTURE OL10 CANVAS
            // =================================================

            function getOL10Canvas() {
                const vp = document.querySelector('.ol-viewport');
                if (!vp) throw new Error('OL10 viewport not found.');

                const canvas = vp.querySelector('canvas');
                if (!canvas) throw new Error('OL10 canvas not found.');

                const copy = document.createElement('canvas');
                copy.width  = canvas.width;
                copy.height = canvas.height;
                const ctx = copy.getContext('2d');
                ctx.drawImage(canvas, 0, 0);

                return { canvas: copy, w: copy.width, h: copy.height };
            }

            // =================================================
            // 5. OL10 VIEW
            // =================================================

            function getOL10View() {
                const view = olMap.getView();
                const size = olMap.getSize();
                const extent = view.calculateExtent(size);
                const proj = view.getProjection().getCode();

                return {
                    left:   extent[0],
                    bottom: extent[1],
                    right:  extent[2],
                    top:    extent[3],
                    w: size[0],
                    h: size[1],
                    crs: proj
                };
            }

            // =================================================
            // 6. METADATA
            // =================================================

            function getMetadata(data, view) {
                const resolutionX = (view.right - view.left) / data.w;
                const resolutionY = (view.top - view.bottom) / data.h;

                if (!Number.isFinite(resolutionX) ||
                    !Number.isFinite(resolutionY) ||
                    resolutionX <= 0 || resolutionY <= 0) {
                    throw new Error('Invalid geographic resolution.');
                }

                return {
                    left: view.left,
                    top: view.top,
                    right: view.right,
                    bottom: view.bottom,
                    resolutionX: resolutionX,
                    resolutionY: resolutionY,
                    crs: view.crs
                };
            }

            // =================================================
            // 7. HIGH RESOLUTION
            // =================================================

            function createHighResolutionCanvas(data, dpi) {
                const factor = dpi / 96;
                const newWidth  = Math.round(data.w * factor);
                const newHeight = Math.round(data.h * factor);

                const canvas = document.createElement('canvas');
                canvas.width  = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(data.canvas, 0, 0, newWidth, newHeight);

                return { canvas: canvas, w: newWidth, h: newHeight };
            }

            // =================================================
            // 8. CORS CHECK
            // =================================================

            function isCanvasSafe(canvas) {
                try {
                    canvas.getContext('2d').getImageData(0, 0, 1, 1);
                    return true;
                } catch (e) {
                    return false;
                }
            }

            function warnUnsafeBasemap() {
                alert(
                    'Unable to export with the current basemap.\n\n' +
                    'The selected basemap (Google, OpenStreetMap, etc.) ' +
                    'does not allow pixel reading due to browser security restrictions (CORS).\n\n' +
                    'Please switch to a basemap served by your own project ' +
                    '(WMS from QGIS Server) and try again.'
                );
            }

            // =================================================
            // 9. EXPORT GEOTIFF
            // =================================================

            btnGeoTIFF.addEventListener('click', async function (evt) {
                evt.preventDefault();
                btnGeoTIFF.disabled = true;

                try {
                    const GeoTIFF = await loadGeoTIFF();

                    // 1. OL10 view
                    const view = getOL10View();

                    // 2. OL10 canvas
                    const originalData = getOL10Canvas();

                    // 3. CORS check
                    if (!isCanvasSafe(originalData.canvas)) {
                        warnUnsafeBasemap();
                        return;
                    }

                    // 4. DPI
                    const dpi = parseInt(dpiSelect.value, 10);
                    const data = createHighResolutionCanvas(originalData, dpi);

                    // 5. Metadata
                    const geo = getMetadata(data, view);

                    console.log('OL10 view:', view);
                    console.log('TIFF dimensions:', data.w, 'x', data.h);
                    console.log('Geo resolution:', geo.resolutionX, geo.resolutionY);

                    // 6. RGB
                    const ctx = data.canvas.getContext('2d');
                    const imgData = ctx.getImageData(0, 0, data.w, data.h);
                    const numPixels = data.w * data.h;
                    const rgb = new Uint8Array(numPixels * 3);
                    for (let i = 0; i < numPixels; i++) {
                        rgb[i * 3]     = imgData.data[i * 4];
                        rgb[i * 3 + 1] = imgData.data[i * 4 + 1];
                        rgb[i * 3 + 2] = imgData.data[i * 4 + 2];
                    }

                    // 7. GeoTIFF metadata
                    const metadata = {
                        width: data.w,
                        height: data.h,
                        SamplesPerPixel: 3,
                        PhotometricInterpretation: 2,
                        PlanarConfiguration: 1,
                        BitsPerSample: [8, 8, 8],
                        SampleFormat: [1, 1, 1],
                        ModelPixelScale: [geo.resolutionX, geo.resolutionY, 0],
                        ModelTiepoint: [0, 0, 0, geo.left, geo.top, 0],
                        GTRasterTypeGeoKey: 1
                    };

                    const epsgMatch = geo.crs.match(/EPSG:(\d+)/i);
                    if (epsgMatch) {
                        const epsg = parseInt(epsgMatch[1], 10);
                        if (epsg === 4326 || epsg === 4258) {
                            metadata.GTModelTypeGeoKey = 2;
                            metadata.GeographicTypeGeoKey = epsg;
                        } else {
                            metadata.GTModelTypeGeoKey = 1;
                            metadata.ProjectedCSTypeGeoKey = epsg;
                        }
                    }

                    // 8. Generate and download
                    const arrayBuffer = await GeoTIFF.writeArrayBuffer(rgb, metadata);
                    const blob = new Blob([arrayBuffer], { type: 'image/tiff' });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'lizmap_georef_map.tif';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                    console.log('=== GEOTIFF EXPORTED ===');

                } catch (error) {
                    console.error('GeoTIFF export error:', error);
                    alert('GeoTIFF export error:\n' + error.message);
                } finally {
                    btnGeoTIFF.disabled = false;
                }
            });

            console.log('Lizmap Extras: initialized (OL10 + CORS check).');
        }
    });
})();
