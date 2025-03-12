/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

const lizmapExternalLinks = function() {

    // ID of the dock (do not change)
    const DOCK_ID = 'external-links';
    // Icon of the dock menu and used before each link
    // See https://getbootstrap.com/2.3.2/base-css.html#icons
    const DOCK_ICON = 'icon-map-marker';
    // Dock position: can be dock, minidock, right-dock
    const DOCK_POSITION = 'right-dock';
    // Title of the dock
    const DOCK_TITLE = 'External resources';
    // Description displayed at the top of the dock content
    const DOCK_DESCRIPTION = 'You can view the current map area in other tools.';
    // Sentence used when no click has been made on the map yet
    const DOCK_PLEASE_CLICK = 'Please click on the map to get the updated links.';
    // Default Z value
    const DEFAULT_Z_VALUE = 15;
    // List of links to display, with a title and a URL
    // You must replace
    // the longitude by LONGITUDE and the latitude by LATITUDE (upper case)
    // AND the z value by Z
    const DOCK_LINKS = [
        {
            'title': 'OpenStreetMap',
            'url': `https://www.openstreetmap.org/?mlat=LATITUDE&mlon=LONGITUDE#map=Z/LATITUDE/LONGITUDE`
        },
        {
            'title': 'Waze',
            'url': `https://www.waze.com/livemap/?zoom=Z&lat=LATITUDE&lon=LONGITUDE`
        },
        {
            'title': 'Google',
            'url': `https://maps.google.com/maps?ll=LATITUDE,LONGITUDE&q=LATITUDE,LONGITUDE&hl=fr&t=m&z=Z`
        },
    ];

    // ---------------------------
    // DO NOT EDIT AFTER THIS LINE
    // ---------------------------

    /**
     * Add the Lizmap dock with the links
     * every time the user clicks on the map
     *
     * @param event Click event
     */
    function buildHtml(longitude = null, latitude = null) {
        let dockHtml = '';
        dockHtml += `<p style="padding: 5px;">${DOCK_DESCRIPTION}</p>`;
        if (longitude && latitude) {
            dockHtml += `<p style="padding: 5px;"><b>Longitude</b> : ${longitude}<br><b>Latitude</b> : ${latitude}</p>`;
            dockHtml += '<table class="table table-condensed table-hover table-striped table-bordered table-">';
            dockHtml += '<tbody>';
            // Add a line for each link to display
            for (let i in DOCK_LINKS) {
                const link = DOCK_LINKS[i];
                let href = link.url;
                const latitudeRegex = /LATITUDE/g;
                const longitudeRegex = /LONGITUDE/g;
                const zRegex = /Z/g;
                href = href.replace(longitudeRegex, longitude);
                href = href.replace(latitudeRegex, latitude);
                href = href.replace(zRegex, DEFAULT_Z_VALUE);
                dockHtml += `
                    <tr class="external-link-line" title="${link.title}" style="cursor: pointer;" onclick="this.querySelector('a').click();">
                        <td>
                            <i class="${DOCK_ICON}"></i>
                        </td>
                        <td title="${href}">
                            ${link.title}<a href="${href}" target="_blank" style="display: none;">link</a>
                        </td>
                    </tr>
                `;
            }
            dockHtml += '</tbody>';
            dockHtml += '</table>';
        } else {
            dockHtml += `<p style="padding: 5px; font-style: italic; font-size: 0.8em; background: lightgray;">${DOCK_PLEASE_CLICK}</p>`;
        }

        return dockHtml;
    }

    /**
     * Create and add the new dock in Lizmap Web Client interface
     *
     */
    function addLinkDock() {
        const content = buildHtml();
        const html = `
            <div id="lizmap-external-links" style="font-size: 11pt;">
            ${content}
            </div>
        `;
        lizMap.addDock(
            DOCK_ID, DOCK_TITLE, DOCK_POSITION, html, DOCK_ICON
        );
    }

    /**
     * Refresh the content of the external links dock
     * every time the user clicks on the map
     *
     * @param event Click event
     */
    function onMapClick(event) {
        // update panel only if active
        if (document.getElementById(DOCK_ID).classList.contains('active')) {
            let point  = new lizMap.ol.geom.Point(event.coordinate);
            if(lizMap.map.projection.projCode != "EPSG:4326"){
                // reproject point to 4326
                point.transform(lizMap.map.projection.projCode, 'EPSG:4326');
            }

            const longitude = point.getCoordinates()[0].toFixed(6);
            const latitude = point.getCoordinates()[1].toFixed(6)
            let content = buildHtml(longitude, latitude);
            divTarget = document.getElementById('lizmap-external-links');
            if (divTarget) {
                // Replace content
                divTarget.innerHTML = content;
            }
        }
    }

    function onDockClosed(clickeDockId)
    {
        if (clickeDockId == DOCK_ID) {
            // external link dock closed : enable popup behaviour
            lizMap.mainLizmap.popup.active = true;
        }
    }

    function onDockOpened(clickeDockId)
    {
        if (clickeDockId == DOCK_ID) {
            // external link dock closed : disable popup behaviour
            lizMap.mainLizmap.popup.active = false;
        }
    }

    // Listen to Lizmap Web Client interface creation
    lizMap.events.on({
        uicreated: function () {

            // Create the dock
            addLinkDock();

            // Register a click on OpenLayers > 2 map
            lizMap.mainLizmap.map.on('singleclick', onMapClick);
        },
        dockopened: function(e) {
            onDockOpened(e.id);
        },
        minidockopened: function(e) {
            onDockOpened(e.id);
        },
        rightdockopened: function(e) {
            onDockOpened(e.id);
        },
        // Dock closed
        dockclosed: function(e) {
            onDockClosed(e.id);
        },
        minidockclosed: function(e) {
           onDockClosed(e.id);
        },
        rightdockclosed: function(e) {
            onDockClosed(e.id);
        }
    });

    return {
        'id': DOCK_ID,
        'title': DOCK_Title,
    }

}();