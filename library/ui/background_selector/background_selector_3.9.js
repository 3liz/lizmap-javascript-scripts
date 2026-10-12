/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * Developed by GEOLAB - Arnaud VANDECASTEELE
 * There isn't any guarantee that this script will work on another version of
 * Lizmap Web Client.
 *
 * Background selector - LWC 3.9
 * ------------------------------
 * A container on the map holding a badge that shows the current base layer and a panel
 * listing every base layer. Clicking the badge opens the panel; clicking a row
 * switches the base layer.
 *
 * This script differs from the previous version as thumbnails are not shipped PNGs anymore.
 * They come from a WMS GetMap request to the Lizmap server (base layers backed by the QGIS project) or from a tile of the
 * already-loaded OpenLayers source (xyz / wmts / bing / google).
 *
 * Overall position and open direction: see background_selector_3.9.css
 */

(function () {
	'use strict';
	/* ------------------------------------------------------------------ *
	 *  Editable configuration
	 * ------------------------------------------------------------------ */

	/** Does the badge follow the current map view (centre + zoom) or stay frozen after load / base layer change?
	 *  true: the BADGE thumbnail follows the current map centre + zoom.
	 *  false: the badge is frozen after load / base layer change.
	 *  (No effect on the panel: its thumbnails only refresh on open, and only
	 *   if the view changed - see refreshPanelThumbs.) */
	const BS_FOLLOW_MAP_VIEW = true;

	/** Does the panel show the base layer title next to the thumbnail?
	 *  true: thumbnail + text label on each panel row.
	 *  false: thumbnails only (title shown as a tooltip on hover). */
	const BS_SHOW_LABELS = true;

	/** Specify the zoom-out applied to the thumbnail images (0 = current zoom).
	 *  1 or 2 give a wider, often more legible preview. */
	const BS_PREVIEW_ZOOM_OUT = 0;

	/* ------------------------------------------------------------------ *
	 *  !!! DO NOT CHANGE BELOW !! Configuration you should not change (unless you know what you're doing)
	 * ------------------------------------------------------------------ */

	/** Size (px) of the GetMap image requested for project base layers. */
	const BS_WMS_PREVIEW_SIZE = 128;

	/** Debounce (ms) for the badge following the map view. */
	const BS_REFRESH_DEBOUNCE = 200;

	/** DOM ids (must stay in sync with background_selector_3.9.css). */
	const BS_WRAPPER_ID = 'baselayer-selector';
	const BS_SELECTOR_ID = 'baselayer-image-selector';
	const BS_PANEL_ID = 'baselayer-image-panel';

	lizMap.events.on({

		uicreated: function () {

			// Do nothing if the container already exists.
			if (document.getElementById(BS_WRAPPER_ID)) {
				return;
			}

			const baseLayersState = lizMap.mainLizmap.state.baseLayers;
			const mapState = lizMap.mainLizmap.state.map;
			const ol = lizMap.ol;

			// Project with no base layer: nothing to do.
			if (!baseLayersState.baseLayerNames || baseLayersState.baseLayerNames.length === 0) {
				return;
			}

			/** Panel (base layer list), created by buildPanel(). */
			let panel = null;
			/** View signature at the last panel thumbnail computation. */
			let panelThumbsSig = null;
			/** name -> Image(): keeps the bytes in memory (no re-download). */
			const panelThumbCache = {};

			/* -------------------------------------------------------------- *
			 *  Utilities
			 * -------------------------------------------------------------- */

			/**
			 * Avoid multiple getPreviewUrl calls as map.state.changed is fired very often when moving the map.
			 * Only fires the callback after `wait` ms have elapsed since the last call.
			 * @see https://davidwalsh.name/javascript-debounce-function
			 * @param {Function} fn
			 * @param {number} wait
			 * @returns {Function}
			 */
			function debounce(fn, wait) {
				let timer = null;
				return function () {
					const args = arguments;
					clearTimeout(timer);
					timer = setTimeout(function () { fn.apply(null, args); }, wait);
				};
			}

			/**
			 * Get OpenLayers layer object based on layer name.
			 * Use lizMap.mainLizmap.baseLayersMap for LWC 3.7 and lizMap.mainLizmap.map for LWC >= 3.8
			 * to support both versions.
			 * @param {string} layerName
			 * @returns {Object|undefined}
			 */
			function getOlBaseLayer(layerName) {
				const olMap = lizMap.mainLizmap?.baseLayersMap /* LWC 3.7 */
					|| lizMap.mainLizmap?.map /* LWC >= 3.8 */;
				if (!olMap) {
					return undefined;
				}
				if (olMap.baseLayersGroup) {
					return olMap.baseLayersGroup.getLayersArray()
						.find(function (l) { return l.get('name') === layerName; });
				}
				return olMap.getLayerGroup().getLayersArray()
					.find(function (l) { return l.get('name') === layerName; });
			}

			/**
			 * Human-readable title of a base layer (falls back to its name).
			 * @param {string} name
			 * @returns {string}
			 */
			function getBaseLayerTitle(name) {
				try {
					return baseLayersState.getBaseLayerByName(name).title || name;
				} catch (e) {
					return name;
				}
			}

			/**
			 * Get current center + resolution + projection, with zoom-out applied.
			 * @returns {{center:number[], resolution:number, projection:string}}
			 */
			function getViewState() {
				return {
					center: mapState.center,
					resolution: mapState.resolution * Math.pow(2, BS_PREVIEW_ZOOM_OUT),
					projection: mapState.projection
				};
			}

			/* -------------------------------------------------------------- *
			 *  Building the thumbnail URL
			 * -------------------------------------------------------------- */

			/**
			 * Retrieve the thumbnail URL for a WMS base layer, framed on the current centre.
			 * @param {Object} source OL source exposing getParams()
			 * @param {Object} baseLayerState base layer state (for itemState.wmsName)
			 * @returns {string|null}
			 */
			function buildWmsPreviewUrl(source, baseLayerState) {
				if (typeof source.getParams !== 'function') {
					return null;
				}
				const srcParams = source.getParams() || {};
				const layers = srcParams.LAYERS
					|| (baseLayerState && baseLayerState.itemState && baseLayerState.itemState.wmsName);
				if (!layers) {
					return null;
				}

				const view = getViewState();
				const half = view.resolution * BS_WMS_PREVIEW_SIZE / 2;
				const cx = view.center[0];
				const cy = view.center[1];

				const params = {
					SERVICE: 'WMS',
					REQUEST: 'GetMap',
					VERSION: '1.3.0',
					LAYERS: layers,
					STYLES: srcParams.STYLES || '',
					CRS: view.projection,
					BBOX: [cx - half, cy - half, cx + half, cy + half].join(','),
					WIDTH: BS_WMS_PREVIEW_SIZE,
					HEIGHT: BS_WMS_PREVIEW_SIZE,
					FORMAT: 'image/png',
					TRANSPARENT: 'true',
					DPI: 96
				};

				const baseUrl = (typeof source.getUrls === 'function' && source.getUrls()[0])
					|| (typeof source.getUrl === 'function' && source.getUrl())
					|| globalThis.lizUrls.wms;

				const usp = new URLSearchParams(params);
				return baseUrl + (baseUrl.indexOf('?') === -1 ? '?' : '&') + usp.toString();
			}

			/**
			 * Retrieve the thumbnail URL for a tile layer, framed on the current centre.
			 * @param {Object} source tiled OL source (XYZ / WMTS / BingMaps / Google)
			 * @returns {string|null}
			 */
			function buildTilePreviewUrl(source) {
				try {
					const tileGrid = typeof source.getTileGrid === 'function' ? source.getTileGrid() : null;
					const urlFn = typeof source.getTileUrlFunction === 'function' ? source.getTileUrlFunction() : null;
					if (!tileGrid || !urlFn) {
						return null;
					}

					const view = getViewState();
					const sourceProj = (typeof source.getProjection === 'function' && source.getProjection())
						|| view.projection;
					const coord = ol.proj.transform(view.center, view.projection, sourceProj);

					const z = tileGrid.getZForResolution(view.resolution);
					const tileCoord = tileGrid.getTileCoordForCoordAndZ(coord, z);
					if (!tileCoord) {
						return null;
					}

					const url = urlFn(tileCoord, window.devicePixelRatio || 1, sourceProj);
					return url || null;
				} catch (e) {
					console.warn('[background_selector] tile unavailable:', e);
					return null;
				}
			}

			/**
			 * Retrieve the thumbnail URL for a base layer, or null if there is no image.
			 * @param {string} name
			 * @returns {string|null}
			 */
			function getPreviewUrl(name) {
				try {
					let baseLayerState = null;
					try {
						baseLayerState = baseLayersState.getBaseLayerByName(name);
					} catch (e) { /* unknown base layer */ }

					if (baseLayerState && baseLayerState.type === 'empty') {
						return null;
					}

					const olLayer = getOlBaseLayer(name);
					const source = olLayer && olLayer.getSource();
					if (!source) {
						return null;
					}

					if (typeof source.getParams === 'function') {
						const wmsUrl = buildWmsPreviewUrl(source, baseLayerState);
						if (wmsUrl) {
							return wmsUrl;
						}
					}
					return buildTilePreviewUrl(source);
				} catch (e) {
					console.warn('[background_selector] thumbnail unavailable for', name, e);
					return null;
				}
			}

			/**
			 * Loads `url` OFF-SCREEN and only applies it as `el` background-image
			 * once it is fully loaded -> no flash, no partial image: the old
			 * image stays visible until the new one is ready.
			 * @param {HTMLElement} el
			 * @param {string|null} url
			 * @param {string} [key] cache key: keeps the Image ref alive and
			 *        identifies the "current" request (a newer request for the
			 *        same key cancels the previous one's application).
			 * @returns {void}
			 */
			function setThumb(el, url, key) {
				if (!url) {
					el.style.backgroundImage = 'none';
					el.classList.add('empty');
					return;
				}
				const clean = url.replace(/["']/g, '');
				const img = new Image();
				if (key) {
					panelThumbCache[key] = img;   // = the current request for this key
				}
				img.addEventListener('load', function () {
					if (key && panelThumbCache[key] !== img) {
						return;   // a newer request took over
					}
					el.style.backgroundImage = 'url("' + clean + '")';
					el.classList.remove('empty');
				}, { once: true });
				img.addEventListener('error', function () {
					console.warn('[background_selector] image unavailable:', clean);
				}, { once: true });
				img.src = url;
			}

			/* -------------------------------------------------------------- *
			 *  HTML ELEMENT - Badge: current base layer
			 * -------------------------------------------------------------- */

			const selector = document.createElement('div');
			selector.id = BS_SELECTOR_ID;
			selector.tabIndex = 0;
			selector.setAttribute('role', 'button');
			selector.setAttribute('aria-haspopup', 'listbox');
			selector.setAttribute('aria-controls', BS_PANEL_ID);
			selector.setAttribute('aria-expanded', 'false');

			/**
			 * Refreshes the badge image + tooltip (current base layer) and the
			 * active row in the panel.
			 * @returns {void}
			 */
			function updateSelector() {
				const name = baseLayersState.selectedBaseLayerName;
				selector.title = getBaseLayerTitle(name);
				setThumb(selector, getPreviewUrl(name), 'selector');

				if (panel) {
					panel.querySelectorAll('.bs-item').forEach(function (item) {
						const isActive = item.dataset.name === name;
						item.classList.toggle('active', isActive);
						item.setAttribute('aria-selected', isActive ? 'true' : 'false');
					});
				}
			}

			/* -------------------------------------------------------------- *
			 *  HTML ELEMENT - Panel: base layer list
			 * -------------------------------------------------------------- */

			/**
			 * Builds the panel and its rows (once).
			 * @returns {HTMLElement}
			 */
			function buildPanel() {
				panel = document.createElement('div');
				panel.id = BS_PANEL_ID;
				panel.setAttribute('role', 'listbox');
				// Do NOT use display:none: as a display:none panel
				// does not download its background-image
				// => Flashy effect when opening the panel: the images are downloaded after the panel is displayed.
				panel.style.visibility = 'hidden';

				baseLayersState.baseLayerNames.forEach(function (name) {
					const title = getBaseLayerTitle(name);

					const item = document.createElement('div');
					item.className = 'bs-item';
					item.dataset.name = name;
					item.title = title;
					item.setAttribute('role', 'option');

					const thumb = document.createElement('div');
					thumb.className = 'bs-item-thumb';
					item.appendChild(thumb);

					if (BS_SHOW_LABELS) {
						const label = document.createElement('span');
						label.className = 'bs-item-label';
						label.textContent = title;
						item.appendChild(label);
					}

					item.addEventListener('click', function () {
						if (name !== baseLayersState.selectedBaseLayerName) {
							baseLayersState.selectedBaseLayerName = name;
						}
						closePanel();
					});

					panel.appendChild(item);
				});

				return panel;
			}

			/**
			 * Refresh each thumbnail only if the view (centre + resolution) changed since the last computation.
			 * setThumb() keeps a live Image ref per base layer (panelThumbCache)
			 * -> no re-download on reopen, even with no-store.
			 * @returns {void}
			 */
			function refreshPanelThumbs() {
				// Do nothing if the view hasn't moved since the last computation:
				// thumbnails are already in place, opening is instant.
				const sig = mapState.center.join(',') + '@' + mapState.resolution;
				if (sig === panelThumbsSig) {
					return;
				}
				panelThumbsSig = sig;

				panel.querySelectorAll('.bs-item').forEach(function (item) {
					const name = item.dataset.name;
					setThumb(item.querySelector('.bs-item-thumb'), getPreviewUrl(name), name);
				});
			}

			/**
			 * Open the panel, refresh its thumbnails and set up the event listeners to close it.
			 */
			function openPanel() {
				refreshPanelThumbs();
				panel.style.visibility = 'visible';       // inline: independent of the CSS
				wrapper.classList.add('open');            // for the badge border style
				selector.setAttribute('aria-expanded', 'true');
				document.addEventListener('click', onDocumentClick, true);
				document.addEventListener('keydown', onKeyDown);
			}

			/**
			 * Close the panel and remove the event listeners.
			 */
			function closePanel() {
				panel.style.visibility = 'hidden';
				wrapper.classList.remove('open');
				selector.setAttribute('aria-expanded', 'false');
				document.removeEventListener('click', onDocumentClick, true);
				document.removeEventListener('keydown', onKeyDown);
			}

			/**
			 * Toggle the panel open/closed state.
			 */
			function togglePanel() {
				if (panel.style.visibility === 'visible') {
					closePanel();
				} else {
					openPanel();
				}
			}

			/**
			 * A click outside the wrapper (badge + panel) closes the panel.
			 * @param {*} evt
			 */
			function onDocumentClick(evt) {
				// wrapper holds the badge AND the panel -> a single test
				if (!wrapper.contains(evt.target)) {
					closePanel();
				}
			}

			/**
			 * Pressing Escape closes the panel and returns focus to the badge.
			 * @param {*} evt
			 */
			function onKeyDown(evt) {
				if (evt.key === 'Escape') {
					closePanel();
					selector.focus();
				}
			}

			/* -------------------------------------------------------------- *
			 *  CONSTRUCTOR: build the badge + panel and append them to the map-content
			 * -------------------------------------------------------------- */

			selector.addEventListener('click', togglePanel);
			selector.addEventListener('keydown', function (evt) {
				if (evt.key === 'Enter' || evt.key === ' ') {
					evt.preventDefault();
					togglePanel();
				}
			});

			const wrapper = document.createElement('div');
			wrapper.id = BS_WRAPPER_ID;
			wrapper.appendChild(selector);
			wrapper.appendChild(buildPanel());
			document.getElementById('map-content').appendChild(wrapper);

			baseLayersState.addListener(function () {
				updateSelector();
			}, ['baselayers.selection.changed']);

			if (BS_FOLLOW_MAP_VIEW) {
				mapState.addListener(
					debounce(updateSelector, BS_REFRESH_DEBOUNCE),
					['map.state.changed']
				);
			}

			// First badge render.
			updateSelector();

			// Warm up the panel thumbnails, off the critical loading path,
			// avoid loading them on the first panel open (which would be a bit flashy).
			setTimeout(refreshPanelThumbs, 1200);
		}
	});
})();
