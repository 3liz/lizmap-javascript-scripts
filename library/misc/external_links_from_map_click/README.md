# External links

## Presentation

This script adds a new tool allowing to click on the map to get the **longitude** and **latitude** (degrees)
and presenting a list of configurable external links configured with these coordinates.

![External links](./lizmap-web-client-external-links.webm)

## Configuration

You can edit the variables at the top of the file to change some settings like the **title** of the tool, its **description**, the **icon** used (See [available icons](https://getbootstrap.com/2.3.2/base-css.html#icons))

The list of **external links** can be set by editing the variable `DOCK_LINKS`. Here is the copy of the commented variable you can edit:

```javascript
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
```
