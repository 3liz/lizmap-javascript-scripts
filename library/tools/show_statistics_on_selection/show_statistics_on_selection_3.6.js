/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

var lizSelectionStatistics = function () {

    // Aggregate functions can be:
    // count, sum, average, minimum, maximum
    var statistics_config = {
        'layers': {
            'Parcelles': {
                fields: {
                    'geo_parcelle': ['count'],
                    'surface_geo': ['sum', 'minimum', 'maximum']
                }
            },
            'Sections': {
                fields: {
                    'geo_section': ['count'],
                    'ogc_fid': ['minimum', 'maximum']
                }
            }
        }
    };

    var selection_statisticts_locales = {
        'count': 'Count',
        'sum': 'Sum',
        'average': 'Average',
        'minimum': 'Minimum',
        'maximum': 'Maximum'
    }


    /** Get features from WFS
     * We must use a personalized function to get only the selected features
     *
     */
    function getWfsFeatures(aName, aCallBack) {
        // Get selected features
        var cleanName = lizMap.cleanName(aName);
        var selectionLayer = lizMap.getLayerNameByCleanName(cleanName);

        if (!selectionLayer) {
            selectionLayer = aName;
        }

        // Get WFS url and options
        let restrictToMapExtent = false;
        var getFeatureUrlData = lizMap.getVectorLayerWfsUrl(aName, null, null, null, restrictToMapExtent);

        // Set export format
        getFeatureUrlData['options']['OUTPUTFORMAT'] = 'GeoJSON';
        getFeatureUrlData['options']['GEOMETRYNAME'] = 'none';

        // Add selection token
        var layer_config = lizMap.config.layers[selectionLayer];

        // We need to wait a little bit so that the selectiontoken is refreshed in the request_params
        // This is a workaround
        setTimeout(function () {
            if ('request_params' in layer_config && 'selectiontoken' in layer_config['request_params']) {
                var selection_token = layer_config['request_params']['selectiontoken'];
                if (selection_token != '') {
                    getFeatureUrlData['options']['SELECTIONTOKEN'] = selection_token;
                }
            }
            $.post(getFeatureUrlData['url'], getFeatureUrlData['options'], function (data) {
                aCallBack(selectionLayer, data.features);
            });
        }, 500);


    }

    function aggregateArray(input_array, aggregate_function) {
        var computed_value = null;
        switch (aggregate_function) {
            case 'count':
                computed_value = input_array.length;
                break;

            case 'sum':
                computed_value = input_array.reduce((a, b) => a + b, 0);
                break;

            case 'average':
                computed_value = input_array.reduce((a, b) => a + b, 0) / input_array.length
                break;

            case 'minimum':
                computed_value = Math.min(...input_array);
                break;

            case 'maximum':
                computed_value = Math.max(...input_array);
                break;
        }

        return computed_value;
    }

    /**
     * Compute the statistic for the layer selected features
     * and display them in the map
     */
    function displaySelectionStatistics(layer_name, layer_features, field_aliases) {
        var layer_stat_config = statistics_config.layers[layer_name];
        var stats = {};
        for (var f in layer_features) {
            let feat = layer_features[f];
            for (var field in layer_stat_config['fields']) {
                var field_value = feat['properties'][field];
                if (!(field in stats)) {
                    stats[field] = [];
                }
                stats[field].push(field_value);
            }
        }

        // Create HTML content based on computed statistics
        // as a source of the table #lizmap-selection-statistics-table
        var html = '';
        for (var field in layer_stat_config['fields']) {
            // Get alias
            var field_alias = field;
            if (field_aliases && field in field_aliases && field_aliases[field] != '') {
                field_alias = field_aliases[field];
            }

            // Calculate aggregated value for each aggregate function
            var html_tds = '';
            for (var a in layer_stat_config['fields'][field]) {
                var aggregate_function = layer_stat_config['fields'][field][a];
                if (!(aggregate_function in selection_statisticts_locales)) {
                    continue;
                }
                var aggregate_value = aggregateArray(
                    stats[field],
                    aggregate_function
                );
                html_tds += '<tr>';
                html_tds += '<td>' + selection_statisticts_locales[aggregate_function] + '</td><td>' + aggregate_value + '</td>';
                html_tds += '</tr>';
            }

            // Create row with field name
            if (html_tds != '') {
                html += '<tr>';
                html += '<th colspan=2 align=center>' + field_alias + '</th>';
                html += '</tr>';
                html += html_tds;
            }
        }
        // Replace html table
        var clean_name = lizMap.cleanName(layer_name);
        $('#lizmap-selection-statistics-table-' + clean_name).html(html);
        $('#lizmap-selection-statistics-table-' + clean_name).parent('div').show();
        $('#lizmap-selection-statistics').show();

    }

    function addStatsView() {
        var html = '';
        html += '<div id="lizmap-selection-statistics" style="display: none;">';

        // Add a div, label, table per layer
        for (var l in statistics_config.layers) {
            var layer_name = l;
            var clean_name = lizMap.cleanName(layer_name);
            layer_stat_config = statistics_config.layers[l];
            html += '<div>';
            html += '<b>' + layer_name + '</b>';
            html += '<table id="lizmap-selection-statistics-table-' + clean_name + '" class="table table-condensed lizmap-selection-statistics-table">';
            html += '</table>';
            html += '</div>';
        }
        html += '</div>';
        $('#map-content').append(html);
        if ($('#overview-box').length == 1) {
            $('#lizmap-selection-statistics').addClass('with-overview-box');
        }
    }

    // Add view
    addStatsView();

    // Listen to Lizmap selection changed event and trigger action
    lizMap.events.on({

        'layerSelectionChanged': function (e) {

            // Quit if there is no selection
            if (e.featureIds.length == 0) {
                var clean_name = lizMap.cleanName(e.featureType);
                $('#lizmap-selection-statistics-table-' + clean_name).html('');
                $('#lizmap-selection-statistics-table-' + clean_name).parent('div').hide();

                return true;
            }

            // Variables
            var layer_stat_config = null;
            var process_stat = false;

            // Loop over every layer in statistic config
            // to know if the current selection must trigger stats
            for (var l in statistics_config.layers) {
                var layer_name = l;
                layer_stat_config = statistics_config.layers[l];

                // Check if the given layer name exists in the QGIS project
                var get_map_layer = lizMap.map.getLayersByName(layer_name);
                if (get_map_layer.length == 0) {
                    continue;
                }

                // Check if the given layer name matches the selected layer
                var lizmap_layer = lizMap.config.layers[layer_name];
                if (lizmap_layer.typename == e.featureType) {
                    process_stat = true;
                    break;
                }
            }

            // Quit if the selected layer cannot be found in the statistic config
            if (!process_stat) {
                return true;
            }

            // Request layer features with filtered ids
            // First build the FEATUREID parameter string value based on the layer selection
            var first_feature_id = lizMap.config.layers[layer_name]['selectedFeatures'][0];
            if (!first_feature_id) {
                return true;
            }
            first_feature_id = layer_name + '.' + first_feature_id;

            // First get feature with only one selected id to get aliases (bug...)
            lizMap.getFeatureData(layer_name, null, first_feature_id, 'none', false, 0, 1,
                function (aName, aFilter, cFeatures, cAliases) {
                    // Request layer features filtered for all the selected ids
                    getWfsFeatures(layer_name,
                        function (aName, cFeatures) {
                            displaySelectionStatistics(aName, cFeatures, cAliases);
                        }
                    );
                }
            );
        }
    });
}();
