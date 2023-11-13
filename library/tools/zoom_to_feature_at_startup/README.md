## Lizmap Web Client 3.6

This feature is now deprecated since [3.6](https://www.3liz.com/en/news/lizmap-web-client-3-6.html)

See "Zoom on an object when opening the map"

## Installation

Copy this script in the correct `media/js` directory. See [Lizmap documentation](https://docs.lizmap.com/current/en/publish/customization/javascript.html)

## Usage

You can add the key `fid` in the **map URL hash** to trigger these actions at map startup:

* the map will **zoom** to the corresponding feature
* the feature **popup** will be displayed

`fid` must contain the **QGIS layer Id** followed by the **feature unique Id** (primary key). For example, the **fid** `v_cat20180426181713938.16` corresponds to the layer `v_cat`, QGIS layer id `v_cat20180426181713938` in QGIS, and feature ID `16`.

You must add the **correct hash** (`#`) to the original map URL (for example `https://liz.map/index.php/view/map/?repository=demo&project=cats`), with the `fid` parameter and the chosen value separated by a `:`. For example: `https://liz.map/index.php/view/map/?repository=demo&project=cats#fid:v_cat20180426181713938.16`

The hash is built like this `#fid:[qgis_layer_id].[feature_unique_id]`. In the example above, it is `#fid:v_cat20180426181713938.16`

## Configuration

If you only want to zoom to the feature at startup, and not show the feature popup, you can replace `var show_popup = true;` by `var show_popup = false;`
