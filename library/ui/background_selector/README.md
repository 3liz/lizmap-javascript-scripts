# Background selector

_(like on Google maps)_

## Lizmap Web Client 3.9

Use `background_selector_3.9.js` **and** `background_selector_3.9.css`. Copy both files into your `media/js/project_name` folder, as described in the
[Lizmap Web Client documentation](https://docs.lizmap.com/current/en/publish/customization/javascript.html?#adding-your-own-javascript).
**Always deploy them together: the script and the stylesheet share the same element ids.**

A badge on the bottom of the map shows the current base layer. Click it to open a panel listing every base layer of the project, each with a thumbnail and its title,
then click a row to switch. The panel closes when you pick a base layer, press `Escape`, click outside, or click the badge again.

![Background selector on LWC 3.9](background_selector_3.9.png)

**Unlike the previous version, no PNG image needs** to be shipped anymore: thumbnails are generated live from the project and the current map view.

* Base layers published by the QGIS project (WMS): a small `GetMap` request (128 x 128 px) to the Lizmap server.
* External base layers (OpenStreetMap, IGN WMTS, Bing, Google...): one tile of the layer source already loaded by the map.
* The empty base layer shows a blank thumbnail.

### Options

Edit the constants at the top of `background_selector_3.9.js`:

| Constant | Default | Effect |
|---|---|---|
| `BS_FOLLOW_MAP_VIEW` | `true` | The badge thumbnail follows the map centre and zoom. `false` freezes it after loading or after a base layer change. |
| `BS_SHOW_LABELS` | `true` | Shows the base layer title next to each thumbnail in the panel. `false` shows thumbnails only (the title stays as a tooltip). |
| `BS_PREVIEW_ZOOM_OUT` | `0` | Zoom levels removed for the thumbnails. `1` or `2` give a wider, often more legible preview. |

### Position

`background_selector_3.9.css` hides the native base layer switcher (last rule of the file). To move the badge and its panel together, edit **zone 1** only
(`#content #baselayer-selector`, default `bottom: 50px; right: 250px`).

By default the panel opens upward and grows to the right. Two optional classes on the container change this (styles in zone 4):

* `bs-drop-down`: the panel opens downward (badge at the top of the map);
* `bs-align-right`: the panel grows to the left (badge near the right edge).

Add them in the script, right after the container is created: `wrapper.classList.add('bs-drop-down');`

On mobile (zone 5), the badge moves to the top-left corner and the panel opens downward.

## Older versions (LWC 3.6 / 3.7)

The original base layer switcher is hidden by default when you use this script.
If you want show the base layer switcher, you can comment out the CSS part in background_selector.css this way :

```css
/*#switcher-baselayer{
    display:none;
}*/
```
`background_selector.css` may need to be updated according to the layout elements (overview enabled, atlas, themes, ...) by editing the `#content #baselayer-image-selector` rule

`background_selector-3-6.js` is dedicated for legacy LWC 3.6
