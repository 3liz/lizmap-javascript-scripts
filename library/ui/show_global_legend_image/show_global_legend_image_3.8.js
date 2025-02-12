/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

const MY_LEGEND_TITLE = 'Legend';

/**
* Refresh the content of the given target container
* with the image corresponding to all active & visible layers
* @param {HTMLElement} targetElement Target element where to display the legend image
*/
function refreshGlobalLegendImage(targetElement) {
    // Do not refresh legend if mini-dock is not visible
    const isVisible = document.getElementById('global_legend').checkVisibility();
    if (!isVisible) {
        return;
    }

    // console.log('Refresh global legend');

    // Get Lizmap active layers
    let params = lizMap.mainLizmap.wms._defaultGetLegendGraphicParameters;
    const activeLayers = lizMap.mainLizmap.state.layersAndGroupsCollection.layers.filter(l => (l.checked && l.visibility));
    wmsNames = activeLayers.map(layer => layer.wmsName);
    if (wmsNames.length == 0) return;

    wmsStyles = activeLayers.map(layer => layer.wmsSelectedStyleName);
    params['LAYERS'] = wmsNames.join();
    params['STYLE'] = wmsStyles.join();
    params['FORMAT'] = 'image/png';
    params['BBOX'] = lizMap.mainLizmap.state.map.extent.join();
    params['CRS'] = lizMap.mainLizmap.state.map.projection;
    params['SRCWIDTH'] = lizMap.mainLizmap.state.map.size[0];
    params['SRCHEIGHT'] = lizMap.mainLizmap.state.map.size[1];
    params['LAYERFONTBOLD'] = 'TRUE';
    params['ADDLAYERGROUPS'] = 'TRUE';
    params['LAYERSPACE'] = '6';

    // Set GetLegendGraphics WMS request
    lizMap.mainLizmap.utils.fetch(globalThis['lizUrls'].wms, {
        method: "POST",
        body: new URLSearchParams(params)
    }).then((response) => {
        if (response.status === 200) {
            return response.blob();
        }
        else {
            console.error("HTTP-Error: " + response.status)
        }
    }).then((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        targetElement.innerHTML = '';
        targetElement.appendChild(imageElement);
    }).catch(console.error);
}

lizMap.events.on({
    'uicreated': function(event) {

        // Legend HTML
        const legend_html = `
        <div class="my-legend-container">
            <div id="my-legend-items-container">
            </div>
        </div>
        `;

        // Create mini-dock
        lizMap.addDock(
            'global_legend',
            MY_LEGEND_TITLE,
            'minidock',
            legend_html,
            'icon-tasks'
        );

        const targetContainer = document.getElementById('my-legend-items-container');

        // Insert image on first load
        refreshGlobalLegendImage(targetContainer);

        // Refresh image on layers/group change
        lizMap.mainLizmap.state.rootMapGroup.addListener(
            () => refreshGlobalLegendImage(targetContainer),
            ['layer.visibility.changed', 'group.visibility.changed', 'layer.style.changed', 'group.style.changed']
        );

        // Refresh image on zoom change
        // We might trigger this on extent change,
        // but it will increase the number of requests
        // Useful only if bbox parameter is passed
        // and if QGIS Server returns only visible symbology classes
        lizMap.mainLizmap.state.map.addListener(
            evt => {
                if (evt.hasOwnProperty('zoom')) {
                    refreshGlobalLegendImage(targetContainer);
                }
            },
            ['map.state.changed']
        );
    },

    'minidockopened': function(event) {
        if (event.id == 'global_legend') {
            const targetContainer = document.getElementById('my-legend-items-container');
            if (targetContainer) {
                refreshGlobalLegendImage(targetContainer);
            }
        }
    }

});
