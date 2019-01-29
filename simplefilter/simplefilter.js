var lizSimpleFilterLayer = function() {

    lizMap.events.on({
        'uicreated':function(evt){

        var lizSimpleFilterLayerConfig = {
            // Name of the QGIS layer, as written in the layers panel
            layername: 'mouillage_2010-2018_MT_pts',

            // Should we show the search panel at startup
            showAtStartup: false,

            // Should we display the layer description above the filters
            displayLayerDescription: true,

            // Layer primary key
            primaryKey: 'ID',

            // Layer fields to add in the filter
            fields: ['Annee', 'Clss_tl', 'Biocens'],

            // To replace checkboxes with a select combobox, add the layers in the following select_fields array
            select_fields: [],

            // Zoom to filtered features automatically ?
            zoom_to_features: false,
            // If true, should we zoom exactly, or apply the followin factor
            // 0 zooms exactly, -1 zooms one zoom above
            zoom_factor: -1,

            // max zoom when performing automatic zoom
            // list of zoom & scales for EPSG:3857 :
            // https://www.3liz.com/blog/rldhont/index.php?post/2012/07/17/OpenStreetMap-Tiles-in-QGIS
            max_zoom: 7,

            // Should we add a checkbox (or select option) for the features with NULL or empty ('') values ?
            add_other_item_for_null_values: true,
            // If so, choose the label of the "empty value" checbox
            other_label: 'Autres',

            // Which words or regular expression trigger the checkbox to be place at the bottom
            // This can be used to place "Other" at the bottom
            other_regexp: /^autre(s)?(.+)?/i,

            // Internal script data
            // DO NOT MODIFY
            features_with_pkey: {},
            features_sortable: [],
            total_counter: {},
            filter_counter: {},
            icon_layer_items: {}
        };

        var checkedFieldValues = {};
        var filteredFeaturesIds = [];

        function getSimpleFilterLayerData(featureType) {
            // Get data
            var geom_to_get = 'none';
            if(lizSimpleFilterLayerConfig.zoom_to_features){
                geom_to_get = 'centroid';
            }
            geom_to_get = 'centroid';
            lizMap.getAttributeFeatureData(featureType, null, null, geom_to_get, function(aName, aFilter, aFeatures, aAliases){
                if( aFeatures.length != 0 ) {
                    lizMap.config.layers[featureType].features = aFeatures;
                    lizSimpleFilterLayerConfig['features'] = aFeatures;
                    lizSimpleFilterLayerConfig['featureType'] = featureType;
                    countFeatures(true);
                    launchSimpleFilter();

                }
                $('body').css('cursor', 'auto');
            });
        }

        function countFeatures(initialCount){

            // Add fields as first level keys for counters
            for(var fi in lizSimpleFilterLayerConfig.fields){
                var f = lizSimpleFilterLayerConfig.fields[fi];
                if(initialCount){
                    if( !(f in lizSimpleFilterLayerConfig.total_counter) ){
                        lizSimpleFilterLayerConfig.total_counter[f] = {}
                        lizSimpleFilterLayerConfig.filter_counter[f] = {}
                    }
                }
                else{
                    // Reset filter_counter on each pass
                    lizSimpleFilterLayerConfig.filter_counter[f] = {}
                    filteredFeaturesIds = [];
                }
            }

            // Get checked classes
            if( !initialCount ){
                for(var field in lizSimpleFilterLayerConfig.total_counter){
                    checkedFieldValues[field] = {};
                    if( !(field in lizSimpleFilterLayerConfig.filter_counter) )
                        lizSimpleFilterLayerConfig.filter_counter[field] = {};
                    if ( lizSimpleFilterLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                        var selectId = '#liz-sfl-field-' + field;
                        var selectVal = $(selectId).val();
                        for(var f_val in lizSimpleFilterLayerConfig.total_counter[field]){
                            // Get checked status
                            checkedFieldValues[field][f_val] = (selectVal == lizMap.cleanName(f_val));

                            // Reset counter
                            lizSimpleFilterLayerConfig.filter_counter[field][f_val] = 0;
                        }
                    } else {
                        for(var f_val in lizSimpleFilterLayerConfig.total_counter[field]){
                            // Get checked status
                            var inputId = '#liz-sfl-field-' + field + '-' + lizMap.cleanName(f_val);
                            var ck = $(inputId).hasClass('checked');
                            checkedFieldValues[field][f_val] = ck;

                            // Reset counter
                            lizSimpleFilterLayerConfig.filter_counter[field][f_val] = 0;
                        }
                    }
                }
            }

            // Loop through features
            for(var f in lizSimpleFilterLayerConfig.features){

                // Get feature
                var feat = lizSimpleFilterLayerConfig.features[f];
                var fid = feat.id.split('.').pop();
                var pk_val = feat.properties[lizSimpleFilterLayerConfig.primaryKey];

                // Add feature in dictionary for further ref
                if( initialCount ){
                    // Object corresponding feat primary key and feature
                    lizSimpleFilterLayerConfig['features_with_pkey'][pk_val] = feat;
                }

                // Count occurrence of data for each smart field for the
                for( var fi in lizSimpleFilterLayerConfig.fields ){

                    var field = lizSimpleFilterLayerConfig.fields[fi];
                    var v = feat.properties[field];
                    var f_val = '';
                    if( v && v instanceof String)
                        f_val = v.trim();
                    else if( v )
                        f_val = v;

                    // TOTAL: count only at first pass
                    if(initialCount){
                        // Add default data if the value for this field has not yet been recorded
                        if( !(f_val in lizSimpleFilterLayerConfig.total_counter[field]) ){
                            lizSimpleFilterLayerConfig.total_counter[field][f_val] = 0;
                        }
                        // Increase the counters for total
                        lizSimpleFilterLayerConfig.total_counter[field][f_val] += 1;
                    }

                    // FILTERED
                    if( !(f_val in lizSimpleFilterLayerConfig.filter_counter[field]) ){
                        lizSimpleFilterLayerConfig.filter_counter[field][f_val] = 0;
                    }
                    // Count filtered data
                    if(initialCount){
                        // Increase the counters for total
                        lizSimpleFilterLayerConfig.filter_counter[field][f_val] += 1;
                    }
                }

                if( !initialCount ){
                    // If not initial count, we should increase only if it matches checked field distinct values
                    var add_feature = true;
                    var field_count = {};
//console.log('FEATURE');
//console.log(feat.properties);
                    for( var cfield in checkedFieldValues ){
                        if( !(cfield in field_count) )
                            field_count[cfield] = {}
                        if( !feat.properties[cfield] ){
                            feat.properties[cfield] = '';
                        }
                        var has_checked = false;
                        var add_from_field = false;
                        for( var cval in checkedFieldValues[cfield] ){
                            var achecked = checkedFieldValues[cfield][cval];
                            has_checked = has_checked || achecked;
//console.log('cval = ' + cval);
//console.log('field val = ' + feat.properties[cfield]);
                            // Check the feature field value corresponds to the checkbox value
                            if(
                                feat.properties[cfield] == cval
                                || (''+feat.properties[cfield]).trim() == ''+cval
                            ){
                                // Then we need to add this feature in the counter
                                if( achecked ){
                                    //console.log('matched & checked');
                                    field_count[cfield][cval] = 1;
                                    add_from_field = true;
                                }
                                else{
                                    //console.log('matched & NON coché');
                                    field_count[cfield][cval] = 1;
                                }
                            }

                            // The values does not match this checkbox value
                            else{
                                if( achecked ){
                                    //console.log('NO MATCH & checked');
                                    field_count[cfield][cval] = 0;
                                    // We remove from counter
                                    //add_feature = false;
                                }else{
                                    //console.log('NO MATCH & NON coché');
                                    field_count[cfield][cval] = 0;
                                }
                            }
//console.log('---------');
                        }
                        if ( has_checked && !add_from_field )
                            add_feature = false;
                    }

//console.log(field_count);
//console.log('add_feature = ' + add_feature);

                    if(add_feature){
                        // Add feature ids
                        filteredFeaturesIds.push(fid);

                        // Add counters
                        for( var x in field_count ){
                            for( var y in field_count[x] ){
                                lizSimpleFilterLayerConfig.filter_counter[x][y] += field_count[x][y];
                            }
                        }
                    }

                }else{
                    filteredFeaturesIds.push(fid);
                }
//console.log('==============');
            }

        }

        function sortFeatures(){
            lizSimpleFilterLayerConfig.features_sortable.sort(function(a, b) {
                var nameA=a.toString()[1].toLowerCase(), nameB=b.toString()[1].toLowerCase()
                if (nameA < nameB)
                    return -1
                if (nameA > nameB)
                    return 1
                return 0
            });
        }

        function getSimpleFilterHome(){

            var home = '';
            // Add description
            var lconfig = lizMap.config.layers[lizSimpleFilterLayerConfig.layername]
            if( lizSimpleFilterLayerConfig['displayLayerDescription'] ){
                var labstract = lconfig['abstract'];
                if(labstract != ''){
                    home+= '<p id="liz-sfl-item-layer-abstract">' + labstract + '</p>';
                }
            }

            // Add total feature counter
            var total = filteredFeaturesIds.length;
            if( filteredFeaturesIds.length == 1 && filteredFeaturesIds[0] == -1 )
                total = 0;
            if( !lizMap.lizSimpleFilterLayerConfig )
                total = lizSimpleFilterLayerConfig['features'].length;
            home+= '<a href="#" class="liz-sfl-show-results"><span id="liz-sfl-item-layer-total-count">' + total + '</span> résultats</a>&nbsp;&nbsp;';

            // Add unfilter link
            home+= '<br/><i><a href="#" id="liz-sfl-unfilter">Désactiver le filtre</a></i>';

            // Add combobox with all data
            home+= '<div style="padding:0px 10px;" class="tree">';
            for(var f in lizSimpleFilterLayerConfig.fields){
                var field = lizSimpleFilterLayerConfig.fields[f];
                home+= '<div class="liz-sfl-field-box">';
                var flabel = field;
                if( 'alias' in lconfig
                    && field in lconfig.alias
                    && lconfig.alias[field].trim() != ''
                ){
                    flabel = lconfig.alias[field].trim();
                }
                home+= '<span style="font-weight:bold;">' + flabel +'</span>';

                home+= '<p>';
                if ( lizSimpleFilterLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                    home+= '<select id="liz-sfl-field-' + field + '" class="liz-sfl-field-select">';
                    home+= '<option> --- </option>';
                }
                var fkeys = Object.keys(lizSimpleFilterLayerConfig['total_counter'][field]);
                // Order fkeys alphabetically (which means sort checkboxes for each field)
                fkeys.sort();

                // Move 'other' to the end
                var afkeys = []; var other = null;
                for(var k in fkeys){
                    var f_val = fkeys[k];
                    if( f_val.match(lizSimpleFilterLayerConfig.other_regexp)
                        || !f_val || lizMap.cleanName(f_val) == ''
                    )
                        other = f_val;
                    else
                        afkeys.push(f_val);
                }
                if(other !== null) // we need to keep the '' value, wich means there are NULL values to be pushed in other_label checkbox
                    afkeys.push(other);
                fkeys = afkeys;
                for( var z in fkeys ){
                    var f_val = fkeys[z];
                    var label = f_val;
                    if( !f_val || lizMap.cleanName(f_val) == '' ){
                        label = lizSimpleFilterLayerConfig.other_label;
                        if(!lizSimpleFilterLayerConfig.add_other_item_for_null_values)
                            continue;
                    }
                    if ( lizSimpleFilterLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                        home+= '<option value="' + lizMap.cleanName(f_val) +'">';
                    } else {
                        var inputId = 'liz-sfl-field-' + field + '-' + lizMap.cleanName(f_val);
                        home+= '<span style="font-weight:normal;">';
                        home+= '<button id="' + inputId + '" class="btn checkbox liz-sfl-field-value" value="' + lizMap.cleanName(f_val) +'" title="Filtrer"></button>';

                    }
                    home+= '&nbsp;' + label;
                    home+= '&nbsp;(' + '<span class="liz-sfl-field-counter">';
                    home+= lizSimpleFilterLayerConfig.filter_counter[field][f_val];
                    home+= '</span>' + ')';
                    if ( lizSimpleFilterLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                        home+= '</option>';
                    } else {
                        home+= '</span></br>';
                    }

                }
                if ( lizSimpleFilterLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                    home+= '</select>';
                }
                home+= '</p>';
                home+= '</div>';

            }
            home+= '</div>';

            return home;
        }

        function setSimpleLayerFilter(){

            var layername = lizSimpleFilterLayerConfig.layername;
            var filter = 'filter';
            var allchecked = true;
            var nonechecked = true;
            for( var cfield in checkedFieldValues ){
                var somevalueschecked = false;
                for( var cval in checkedFieldValues[cfield] ){
                    var achecked = checkedFieldValues[cfield][cval];
                    if(!achecked){
                        allchecked = false;
                    }else{
                        somevalueschecked = true;
                        nonechecked = false;
                    }
                }
            }
            // No filter if all checkboxes are checked
            if(nonechecked){
                filter = 'showall';
            }
            // If no fid is in the filter list, this means not filter
            if(filteredFeaturesIds.length == 0){
                filter = 'hideall';
            }
            triggerLayerFilter(layername, filter);
            return true;
        }

        function showResults(forced){
            if( !forced && !lizSimpleFilterLayerConfig.zoom_to_features )
                return;

            var layername = lizSimpleFilterLayerConfig.layername;
            if ( !lizSimpleFilterLayerConfig.zoom_to_features ||
                 ( filteredFeaturesIds.length == 0 ) ||
                 ( filteredFeaturesIds.length == 1 && filteredFeaturesIds[0] == -1 ) ||
                 ( filteredFeaturesIds.length == lizSimpleFilterLayerConfig.features.length ) ){

                var itemConfig = lizMap.config.layers[layername];
                if( itemConfig.type == 'baselayer' )
                    lizMap.map.zoomToMaxExtent();

                var mapProjection = lizMap.map.getProjection();
                if(mapProjection == 'EPSG:900913')
                    mapProjection = 'EPSG:3857';

                if( !( 'bbox' in itemConfig ) || !( mapProjection in itemConfig['bbox'] ) ){
                    console.log('The layer bbox information has not been found in config');
                    console.log(itemConfig);
                    return false;
                }

                var lex = itemConfig['bbox'][mapProjection]['bbox'];
                var lBounds = new OpenLayers.Bounds(
                    lex[0],
                    lex[1],
                    lex[2],
                    lex[3]
                );
                lizMap.map.zoomToExtent( lBounds );
                return;
            }

            // Calculate filtered extent
            var bounds = null;

            for(var f in lizSimpleFilterLayerConfig.features){
                // Get feature
                var feature = lizSimpleFilterLayerConfig.features[f];
                var fid = feature.id.split('.').pop();
                var pk_val = feature.properties[lizSimpleFilterLayerConfig.primaryKey];

                if( !($.inArray(fid, filteredFeaturesIds) != -1) ){
                    //console.log( i + ' n est pas dans ffids (-> on passe');
                    continue;
                }
                if( feature.geometry ) {
                    ex = [feature.geometry.coordinates[0],feature.geometry.coordinates[1],feature.geometry.coordinates[0],feature.geometry.coordinates[1]]
                    if ( bounds == null ) {
                        bounds = new OpenLayers.Bounds(ex);
                    } else
                        bounds.extend(new OpenLayers.Bounds(ex));
                }
            }

            // tras,form bounds to map projection
            var proj = lizMap.config.layers[layername]['featureCrs'];
            // in QGIS server > 2.14 GeoJSON is in EPSG:4326
            if ( 'qgisServerVersion' in lizMap.config.options && lizMap.config.options.qgisServerVersion != '2.14' )
                proj = 'EPSG:4326';
            else if ( !lizMap.config.layers[layername]['featureCrs'] )
                proj = lizMap.config.layers[layername]['crs'];
            extent = bounds.transform(proj, lizMap.map.getProjection());

            // Zoom to data extent - 1
            // Do not zoom too much to avoid geometry at the side and less visible
            // via a configurable zoom factor
            var targetzoom = Math.max(
                0,
                lizMap.map.getZoomForExtent(extent) + lizSimpleFilterLayerConfig.zoom_factor
            );
            // Zoom only to a certain maxzoom
            if( lizSimpleFilterLayerConfig.max_zoom && targetzoom > lizSimpleFilterLayerConfig.max_zoom)
                targetzoom = lizSimpleFilterLayerConfig.max_zoom;
            var targetCenter = extent.getCenterLonLat();
            lizMap.map.zoomTo( targetzoom );
            lizMap.map.setCenter( targetCenter );
        }

        function refreshTotalcount(){
            var total = filteredFeaturesIds.length;
            var has_filter = true;
            if( filteredFeaturesIds.length == 1 && filteredFeaturesIds[0] == -1 ){
                total = 0;
            }
            if( lizMap.lizmapLayerFilterActive === null){
                total = lizSimpleFilterLayerConfig['features'].length;
                has_filter = false;
            }
            $('#liz-sfl-item-layer-total-count').html(total);

        }

        function triggerLayerFilter(layername, filter){
//console.log(filter);
            // Show all features if filter = all
            if(filter == 'showall'){
                // We deactivate the filter
                filteredFeaturesIds = [];
                lizMap.events.triggerEvent("layerfeatureremovefilter", {featureType: layername});
            }else{
                // When the checked values return no features
                // We add a fake id so that nothing is shown
                if( filter == 'hideall' ){
                    filteredFeaturesIds = [-1];
                }

                // Trigger filter
                lizMap.lizmapLayerFilterActive = layername;
                lizMap.config.layers[layername]['filteredFeatures'] = filteredFeaturesIds;
                lizMap.events.triggerEvent("layerFilteredFeaturesChanged",
                    {
                        'featureType': layername
                    }
                );
            }

            // Show corresponding results
            showResults(false);

            refreshTotalcount();

            return true;
        }

        function activateSimpleFilterTrigger(){

            $('.liz-sfl-field-value').click(function(){
                var self = $(this);
                // Do nothing if disabled
                if (self.hasClass('disabled'))
                    return false;
                // Add checked class if unchecked
                if( !self.hasClass('checked') )
                    self.addClass('checked');
                else
                    self.removeClass('checked');

                // Count corresponding features based on checked values
                countFeatures(false);
                // Filter the data
                setSimpleLayerFilter();
            });

            $('.liz-sfl-field-select').change(function(){
                // Count corresponding features based on checked values
                countFeatures(false);
                // Filter the data
                setSimpleLayerFilter();
            });

            // Activate unfilter
            $('#liz-sfl-unfilter').click(function(){
                // Remove feature info geometry
                //removeFeatureInfoGeometry();
                if(lizMap.lizmapLayerFilterActive){
                    $('#layerActionUnfilter').click();
                }
                return false;
            });


            // Activate showResults
            $('.liz-sfl-show-results').click(function(){
                // Show corresponding results
                showResults(true);
                return false;
            });

        }

        function launchSimpleFilter(){
            // Get html
            var home = getSimpleFilterHome(lizSimpleFilterLayerConfig.featureType, lizSimpleFilterLayerConfig.features);

            // Add dock
            var dock = 'dock';
            if( lizMap.checkMobile() )
                dock = 'minidock';
            lizMap.addDock(
                'sfl',
                lizMap.config.layers[lizSimpleFilterLayerConfig.layername]['title'],
                dock,
                home,
                'icon-search'
            );
            var title = '<h3>';
            title+= '<i class="icon-search icon-white" style="margin: 4px;"></i>';
            title+= lizMap.config.layers[lizSimpleFilterLayerConfig.layername]['title'];
            title+= '</h3>';

            // Add events
            activateSimpleFilterTrigger();

            lizMap.events.on({
                layerfeatureremovefilter: function(e){
                    if(e.featureType == lizSimpleFilterLayerConfig.layername){
                        console.log('layerfeatureremovefilter');
                        filteredFeaturesIds = [];

                        // We need to uncheck all checkboxes
                        $('.liz-sfl-field-value.checked').removeClass('checked');
                        // We need to reset comboboxes
                        $('#sfl select.liz-sfl-field-select').val( $('#sfl select.liz-sfl-field-select option:first').val() )

                        countFeatures(false);

                        // Show corresponding results
                        showResults(false);

                        refreshTotalcount();
                    }
                }
            });
        }

        // Launch SmartLayer feature
        getSimpleFilterLayerData(lizSimpleFilterLayerConfig.layername);

        } // uicreated
    });
}();
