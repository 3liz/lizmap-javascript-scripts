# Lizmap JavaScript scripts

![Lizmap logo](icon.png)

You can use those JavaScript scripts to enhance Lizmap Web Client.
Documentation is on [docs.lizmap.com](https://docs.lizmap.com/next/en/publish/customization/javascript.html).

You might have a `README.md` inside the directory with more information and a demo.

Some JavaScript codes presented are self-sufficient while others are examples to help you create the functionality you want.

If you are developing a new feature, do not hesitate to let us know so that we can integrate it.

## API

* [Connecteur vers Oxalis d'Operis (Autorisations du droit des sols (ADS)) 🇫🇷](library/api/oxalis)
* [IGN web services 🇫🇷](library/api/ign_web_services)
* [Google Street View](library/api/google_street_view)
* [Mapillary](library/api/mapillary)
* [GeoFoncier Popup🇫🇷](library/data/geofoncier_wms_getFeatureInfo)

## Data

* [Edit GPX](./library/data/edit_gpx) Import/Export GPX
* [WMTS direct access](./library/data/wmts_direct_access)

## Miscellaneous 

* [Open external links with map click coordinates](./library/misc/external_links_from_map_click)
* [Add keyboard shortcuts](./library/misc/add_shortcuts)
* [Refresh some layers periodically](./library/misc/refresh_layers_every_n_seconds)

## Translation

* [Translate the QGIS project](library/translation/qgis_project) To provide a Lizmap project in many languages
* [Change some labels in the interface](library/translation/interface)

## Tools

* [Attribute table column filter](./library/tools/attribute_table_column_filter)
* [Dynamic form field visibility](./library/tools/dynamic_form_field_visibility)
* [Group time tool](./library/tools/group_time_tool), Display a temporal layers' group as a GIF and generate it
* [Point buffer on map](./library/tools/point_buffer_on_map) Display a buffer on the map
* [Simple filter](./library/tools/simplefilter)
* [Smart filter](./library/tools/smartfilter)
* [Zoom to feature at startup and show popup](./library/tools/zoom_to_feature_at_startup)
* [Display statistics on the current layer selection](./library/tools/show_statistics_on_selection)
* Deprecated since LWC 3.4
  * [Multiple atlas](./library/tools/multipleatlas)
  * [Snapping while editing](./library/tools/snapping_while_editing)

## UI

* [Add documentation](./library/ui/add_documentation) with buttons and a dock
* [Background selector](./library/ui/background_selector), like on Google Maps
* [Expand/collapse legend when layer toggled](./library/ui/expand-collapse-legend-when-layer-toggled)
* [Expand legend on load](./library/ui/expand-legend-on-load), partially deprecated
* [Group collapse](./library/ui/group_collapse)
* [Hide value popup](./library/ui/hide_value_popup)
* [Measure tool custom style](./library/ui/measure_tool_custom_style)
* [Move filter in new panel](./library/ui/move_filter_in_new_panel)
* [Popup when opening the project with metadata information](./library/ui/popup_metadata_info)
* [Remove button](./library/ui/remove_button) to make the UI lighter and easier
* [Resize Dock with splitter](./library/ui/resize_dock_with_splitter)
* [Simplify print options](./library/ui/simplify-print-options)
* [Simplify export options](./library/ui/simplify-export-options)
* [Add button to toggle dock full width](./library/ui/add_dock_resize_button)
* [Add a hard-coded legend at the bottom of the map](./library/ui/add_hard_coded_legend_at_map_bottom)
* [Add placeholder to input/textarea elements](./library/ui/add_placeholder_on_text_controls)
* [Permalink copy to clipboard instead of link](./library/ui/copy-permalink)
* Deprecated since LWC 3.4
  * [Add hamburger menu](./library/ui/add_hamburger_menu) for a better UX on a small screen
