/**
 * Add the select by geometry button for the given popup element
 *
 * @param {HTMLElement} featureToolbar The feature toolbar HTML element of the popup
 * @param {string} featureGeometry The geometry of the feature in WKT
 * @param {string} featureCrs The CRS of the geometry
 */
function addSelectionButton(featureToolbar, featureGeometry, featureCrs) {
    var featureToolbarDiv = featureToolbar.find('div.feature-toolbar');

    // Get the button if it already exists
    const buttonValue = `${featureGeometry}@${featureCrs}`;

    // Selection button HTML
    const selectionButtonHtml = `
        <button class="btn btn-mini popup-select-by-geometry" value="${buttonValue}" type="button" data-original-title="Selection" title="Selection">
            <i class="icon-star"></i>
            &nbsp;
        </button>
    `;

    // Check if the button already exists
    const existingButton = featureToolbarDiv.find(`button.popup-select-by-geometry[value="${buttonValue}"]`);
    if (existingButton.length > 0) {
        return false;
    }

    // Append the button to the toolbar
    featureToolbarDiv.append(selectionButtonHtml);
    // Trigger the action when clicking on button
    featureToolbarDiv.on('click', `button.popup-select-by-geometry[value="${buttonValue}"]`, popupSelectionButtonClickHandler);
}


/**
 * Function which wait for te given ms before returning the promise
 *
 * @param {integer} time - The time in milliseconds
 *
 */
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}


/**
* Reacts to the click on a popup select by geometry/
*
* @param event The event triggered on the button click
*/
function popupSelectionButtonClickHandler(event) {
    // Only go on when the button has been clicked
    // not the child <i> icon
    let target = event.target;
    if (!event.target.matches('.popup-select-by-geometry')) {
        target = target.parentNode;
    }

    // Get the button which triggered the click event
    const button = target;
    const value = button.value;
    const wkt = value.split('@')[0];
    const crs = value.split('@')[1];
    const featureToolbar = button.closest('lizmap-feature-toolbar');
    const featureToolbarValue = featureToolbar.getAttribute('value');

    // check geometry type
    let isPolygon = (wkt.toUpperCase().indexOf('POLYGON') !== -1);
    let isLinestring = (wkt.toUpperCase().indexOf('LINE') !== -1);
    let isPoint = (wkt.toUpperCase().indexOf('POINT') !== -1);

    // Create a temporary layer from the WKT
    const temporaryVector = lizMap.mainLizmap.layers.addLayerFromWKT(wkt, crs, null);

    // Get the features of this layer
    const features = temporaryVector.getSource().getFeatures();

    // Open the selection tool to activate it
    const selectionMenu = document.getElementById('mapmenu').querySelector('li.selectiontool a');
    let selectionMenuIsActive = selectionMenu.parentElement.classList.contains("active");
    if (!selectionMenuIsActive) {
        selectionMenu.click();
    }

    // Clear the previously drawn geometries
    lizMap.mainLizmap.digitizing.drawLayer.getSource().clear();

    // Add the feature created from the popup
    lizMap.mainLizmap.digitizing.drawLayer.getSource().addFeature(features[0]);

    // For polygons
    // We must add a buffer 1 to force the transformation of multipolygon
    // into compatible types. If not done, we get a <multisurface>
    // built up by OpenLayers and sent to the GetFeature request, which fails
    // and return no features
    let hadBuffer = false;
    let hadBufferValue = false;
    if (isPolygon) {
        const selectionToolDiv = document.getElementById('selectiontool');
        const bufferInput = selectionToolDiv.querySelector('div.selectiontool-buffer input');
        hadBufferValue = bufferInput.value;
        if (bufferInput.value == 0) {
            lizMap.mainLizmap.selectionTool._bufferValue = 0.00001;
            hadBuffer = true;
        }
    }

    // Select only inside
    let oldOperator = lizMap.mainLizmap.selectionTool._geomOperator;
    if (isPolygon) {
        lizMap.mainLizmap.selectionTool._geomOperator = 'within';
    }

    // Send the event to let Lizmap run the selection
    lizMap.mainEventDispatcher.dispatch('digitizing.featureDrawn');

    // Remove the temporary vector layer
    lizMap.mainLizmap.layers.removeLayer(temporaryVector);

    // Set back the buffer if necessary
    if (isPolygon && hadBuffer) {
        lizMap.mainLizmap.selectionTool._bufferValue = hadBufferValue;
    }
    if (isPolygon) {
        lizMap.mainLizmap.selectionTool._geomOperator = oldOperator;
    }

    // Remove the selection geometry
    lizMap.mainLizmap.digitizing.drawLayer.getSource().clear();

    // Deactivate back the selection tool
    if (!selectionMenuIsActive) {
        selectionMenu.click();
    }

    // // Deselect the feature which triggered the selection
    delay(5000).then(() => {
        // Get the popup again (it could have disappeared and reappeared after the selection
        const parentToolbar = document.querySelector(`lizmap-feature-toolbar[value="${featureToolbarValue}"]`);
        if (!parentToolbar) return;
        const unselectButton = parentToolbar.querySelector('button.feature-select');
        if (!unselectButton) return;
        if (unselectButton.classList.contains('btn-primary')) {
            unselectButton.click();
        }
    });
}

lizMap.events.on({
    lizmappopupdisplayed: function (e) {
        // Loop through each layer+feature item
        const popupContainer = $('#' + e.containerId); // Container
        const items = popupContainer.find('div.lizmapPopupDiv');

        items.each(function() {
            // Get the layer ID
            const featureId = $(this).find('input.lizmap-popup-layer-feature-id').val();
            
            // Check if there is a geometry
            const featureGeometryInput = $(this).find('input.lizmap-popup-layer-feature-geometry');
            if (!featureGeometryInput.length) {
                return;
            }
            const featureGeometry = featureGeometryInput.val();

            // Geometry CRS
            let featureCrs = 'EPSG:4326';
            const featureCrsInput = $(this).find('input.lizmap-popup-layer-feature-crs');
            if (featureCrsInput.length) {
                featureCrs = featureCrsInput.val();
            }

            // Get feature toolbar
            let featureToolbar = $(this).find(`lizmap-feature-toolbar[value="${featureId}"]`);
            
            if (!featureToolbar.length) {
                // Create feature toolbar
                featureToolbar = $('<lizmap-feature-toolbar>')
                                    .attr('value', featureId)
                                    .css('display', 'inline-flex')
                                    .append($(this).find('input[value="' + featureId + '"]').nextUntil('br'))
                                    .append($('<div>').addClass('feature-toolbar').css('display', 'inline'));
                
                // Insert feature toolbar after input element
                $(this).find('input[value="' + featureId + '"]').after(featureToolbar);
            }
            
            // Add a button in the popup feature bar
            if (featureGeometry && featureCrs) {
                addSelectionButton(featureToolbar, featureGeometry, featureCrs);
            }
        });
    }
});
