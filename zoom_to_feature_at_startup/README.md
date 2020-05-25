## Installation

Copy this script in the correct `media/js` directory. See [Lizmap documentation](https://docs.lizmap.com/current/fr/publish/advanced_lizmap_config.html#adding-your-own-javascript)

## Usage

You can add the `fid` in the **map URL hash** to trigger these actions at map startup:

* the map will **zoom** to the corresponding feature
* the feature **popup** will be displayed

`fid` must contain the **layer ID** followed by the **feature unique ID** (primary key). For example, the **fid** `v_cat20180426181713938.16` corresponds to the layer `v_cat`, id `v_cat20180426181713938` in QGIS, and feature ID `16`.

The given URL should be like this, with the `fid` parameter given in the hash `#` part, and its value after `:` http://liz.map/index.php/view/map/?repository=demo&project=cats#fid:v_cat20180426181713938.16


## Configuration

If you only want to zoom to the feature at startup, and not show the feature popup, you can replace `var show_popup = true;` by `var show_popup = false;`
