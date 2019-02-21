var lizSmartLayer = function() {

    lizMap.events.on({
        'uicreated':function(evt){

        var lizSmartLayerTimer = null;

        var mediaLink = OpenLayers.Util.urlAppend(lizUrls.media
          ,OpenLayers.Util.getParameterString(lizUrls.params)
        )

        var lizSmartLayerConfig = {
            // Name of the QGIS layer, as written in the layers panel
            layername: 'circuit_court',

            // Title to display for the result panel (containing the item cards)
            result_panel_name: 'Nos super points de vente',

            // Should we show the search panel at startup
            showAtStartup: true,

            // Should we display the layer description above the filters
            displayLayerDescription: true,

            // Layer primary key
            primaryKey: 'gid',

            // Layer fields to add in the filter
            // By default, the unique values will be shown as checkboxes
            smartFields: ['lib_type_vente1' , 'liste_famille_produit',  'liste_label_pt_vente', 'liste_services'],

            // To replace checkboxes with a select combobox, add the layers in the following select_fields array
            select_fields: ['liste_services'],

            // Separators to use for each field to split the values into smaller pieces
            // For example "banana, orange, kiwi" can be splited into 3 values (checkboxes) "banana", "orange" and "kiwi"
            valueSeparator: {
                'lib_type_vente1': ',',
                'liste_famille_produit': '-',
                'liste_label_pt_vente': ',',
                'liste_services': ','
            },

            // Layer containing the media files to display images before the checkboxes
            // The layer must respect the following structure
            // id | field   | value   | media
            //  1 | a_field | banana  | media/images/a_banana_image.jpg
            // Use the QGIS layer name
            icon_layer: 'icones_circuit_court',

            // Hide checkboxes if no features correspond to the active filter
            // If false, checkboxes will be greyed out. If true, they will be hidden
            hide_zero_items: false,

            // Zoom to filtered features automatically ?
            zoom_to_features: true,
            // If true, should we zoom exactly, or apply the followin factor
            // 0 zooms exactly, -1 zooms one zoom above
            zoom_factor: -1,

            // max zoom when performing automatic zoom
            // list of zoom & scales for EPSG:3857 :
            // https://www.3liz.com/blog/rldhont/index.php?post/2012/07/17/OpenStreetMap-Tiles-in-QGIS
            max_zoom: 7,
            // Should we display the feature geometry when the user click on an item
            display_geometry: true,
            // Geometry circle color
            geometry_point_color: 'red',
            // Geometry circle size
            geometry_point_size: 15,

            // Should we display a list of cards for the filtered features
            card_display: true,

            // Add the fields to display. For example ['id', 'name', 'description']
            // This will display a table in the format
            //    field    | value
            //          id | 1
            //        name | banana plant
            // description | bananas are good !
            card_fields: [],

            // Card template
            // This allows to configure the display of fields
            // Use the QGIS expression syntax to get the field value: [% "field_name" %]
            // This template can use HTML tags, properties and styling
            card_template: `
                <p><b style="color:purple;font-size:1.2em;">[% "nom" %]</b> - <span style="font-size:1em;">[% "commune" %]</span></p>
                <div style="font-size:0.8em;">
                    <p><b>[% "lib_type_vente1" %]</b> - [% "description" %]</p>
                </div>
                <p>[% "liste_famille_produit_media" %]</p>
            `,

            // The script autodetects media images in cards.
            // If a field contains more than 1 media link, you should provide the separator
            mediaSeparator: '-',

            // Order of the displayed cards. Choose a field
            card_order_field: 'nom',

            // Should we add a checkbox (or select option) for the features with NULL or empty ('') values ?
            add_other_item_for_null_values: false,
            // If so, choose the label of the "empty value" checbox
            other_label: 'Autres',

            // Which words or regular expression trigger the checkbox to be place at the bottom
            // This can be used to place "Other" at the bottom
            other_regexp: /^autre(s)?(.+)?/i,

            // Take the left panel width into account when setting map center ?
            map_center_based_on_dock_width: true,

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

        function getSmartLayerData(featureType) {
            // Get data
            var geom_to_get = 'none';
            if(lizSmartLayerConfig.zoom_to_features){
                geom_to_get = 'centroid';
            }
            lizMap.getAttributeFeatureData(featureType, null, null, geom_to_get, function(aName, aFilter, aFeatures, aAliases){
                if( aFeatures.length != 0 ) {
                    lizMap.config.layers[featureType].features = aFeatures;
                    lizSmartLayerConfig['features'] = aFeatures;
                    lizSmartLayerConfig['featureType'] = featureType;
                    countFeatures(true);
                    if( lizSmartLayerConfig.icon_layer != '' ){
                        lizMap.getAttributeFeatureData(lizSmartLayerConfig.icon_layer, null, null, 'none', function(iName, iFilter, iFeatures, iAliases){
                            if( iFeatures.length != 0 ) {
                                for(var ix in iFeatures){
                                    var ifeat = iFeatures[ix];
                                    lizSmartLayerConfig.icon_layer_items[ifeat.properties.field + '@' + ifeat.properties.value] = ifeat.properties.media;
                                }
                            }
                            launchSmartLayer();
                            $('body').css('cursor', 'auto');
                        });
                    } else{
                        launchSmartLayer();
                    }

                }
                $('body').css('cursor', 'auto');
            });
        }

        function countFeatures(initialCount){

            // Add smart fields as first level keys for counters
            for(var fi in lizSmartLayerConfig.smartFields){
                var f = lizSmartLayerConfig.smartFields[fi];
                if(initialCount){
                    if( !(f in lizSmartLayerConfig.total_counter) ){
                        lizSmartLayerConfig.total_counter[f] = {}
                        lizSmartLayerConfig.filter_counter[f] = {}
                    }
                }
                else{
                    // Reset filter_counter on each pass
                    lizSmartLayerConfig.filter_counter[f] = {}
                    filteredFeaturesIds = [];
                }
            }

            // Get checked classes
            if( !initialCount ){
                for(var field in lizSmartLayerConfig.total_counter){
                    checkedFieldValues[field] = {};
                    if( !(field in lizSmartLayerConfig.filter_counter) )
                        lizSmartLayerConfig.filter_counter[field] = {};
                    if ( lizSmartLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                        var selectId = '#liz-sml-field-' + field;
                        var selectVal = $(selectId).val();
                        for(var f_val in lizSmartLayerConfig.total_counter[field]){
                            // Get checked status
                            checkedFieldValues[field][f_val] = (selectVal == lizMap.cleanName(f_val));

                            // Reset counter
                            lizSmartLayerConfig.filter_counter[field][f_val] = 0;
                        }
                    } else {
                        for(var f_val in lizSmartLayerConfig.total_counter[field]){
                            // Get checked status
                            var inputId = '#liz-sml-field-' + field + '-' + lizMap.cleanName(f_val);
                            var ck = $(inputId).hasClass('checked');
                            checkedFieldValues[field][f_val] = ck;

                            // Reset counter
                            lizSmartLayerConfig.filter_counter[field][f_val] = 0;
                        }
                    }
                }
            }

            // Loop through features
            for(var f in lizSmartLayerConfig.features){

                // Get feature
                var feat = lizSmartLayerConfig.features[f];
                var fid = feat.id.split('.').pop();
                var pk_val = feat.properties[lizSmartLayerConfig.primaryKey];

                // Add feature in dictionary for further ref
                if( initialCount ){
                    // Object corresponding feat primary key and feature
                    lizSmartLayerConfig['features_with_pkey'][pk_val] = feat;

                    // Array allowing to further order by card_order_field field
                    lizSmartLayerConfig.features_sortable.push(
                        [
                            feat.properties[lizSmartLayerConfig.primaryKey],
                            feat.properties[lizSmartLayerConfig.card_order_field]
                        ]
                    );
                }

                // Count occurrence of data for each smart field for the
                for( var fi in lizSmartLayerConfig.smartFields ){

                    var field = lizSmartLayerConfig.smartFields[fi];
                    var v = feat.properties[field];
                    if(!v || v.trim() == '')
                        f_vals = [''];
                    else
                        f_vals = v.split(lizSmartLayerConfig.valueSeparator[field]);

                    for( var i in f_vals){
                        var f_val = f_vals[i].trim();

                        // TOTAL: count only at first pass
                        if(initialCount){
                            // Add default data if the value for this field has not yet been recorded
                            if( !(f_val in lizSmartLayerConfig.total_counter[field]) ){
                                lizSmartLayerConfig.total_counter[field][f_val] = 0;
                            }
                            // Increase the counters for total
                            lizSmartLayerConfig.total_counter[field][f_val] += 1;
                        }

                        // FILTERED
                        if( !(f_val in lizSmartLayerConfig.filter_counter[field]) ){
                            lizSmartLayerConfig.filter_counter[field][f_val] = 0;
                        }
                        // Count filtered data
                        if(initialCount){
                            // Increase the counters for total
                            lizSmartLayerConfig.filter_counter[field][f_val] += 1;
                        }
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
                        for( var cval in checkedFieldValues[cfield] ){
                            var achecked = checkedFieldValues[cfield][cval];
//console.log('cval = ' + cval);
//console.log('field val = ' + feat.properties[cfield]);
                            // Create table of trimed values for this feature field .
                            // Ex: " a, b, c" will give ['a', 'b', 'c']
                            var atable = feat.properties[cfield].split(lizSmartLayerConfig.valueSeparator[cfield]).map(function(item) {
                              return item.trim();
                            });
                            // Check the feature field value corresponds to the checkbox value
                            if(
                                feat.properties[cfield] == cval
                                || feat.properties[cfield].trim() == cval
                                || atable.indexOf(cval) >= 0
                            ){
                                // Then we need to add this feature in the counter
                                if( achecked ){
                                    //console.log('matched & checked');
                                    field_count[cfield][cval] = 1;
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
                                    add_feature = false;
                                }else{
                                    //console.log('NO MATCH & NON coché');
                                    field_count[cfield][cval] = 0;
                                }
                            }
//console.log('---------');
                        }


                    }

//console.log(field_count);
//console.log('add_feature = ' + add_feature);

                    if(add_feature){
                        // Add feature ids
                        filteredFeaturesIds.push(fid);

                        // Add counters
                        for( var x in field_count ){
                            for( var y in field_count[x] ){
                                lizSmartLayerConfig.filter_counter[x][y] += field_count[x][y];
                            }
                        }
                    }

                }else{
                    filteredFeaturesIds.push(fid);
                }
//console.log('==============');
            }
            //console.log('TOTAL');
            //console.log(lizSmartLayerConfig.total_counter);
            //console.log('FILTER');
            //console.log(lizSmartLayerConfig.filter_counter);
            //console.log(filteredFeaturesIds);

            // Sort features
            if( initialCount && lizSmartLayerConfig.card_order_field){
                sortFeatures()
            }
        }

        function sortFeatures(){
            lizSmartLayerConfig.features_sortable.sort(function(a, b) {
                var nameA=a.toString()[1].toLowerCase(), nameB=b.toString()[1].toLowerCase()
                if (nameA < nameB)
                    return -1
                if (nameA > nameB)
                    return 1
                return 0
            });
        }

        function setSmartLayerFilter(){

            var layername = lizSmartLayerConfig.layername;
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

            // Update counters
            updateCounters();

            // Show corresponding results
            showResults(1000,0);

            refreshTotalcount();

            return true;
        }

        function updateCounters(){
            for( var cfield in checkedFieldValues ){
                if ( lizSmartLayerConfig['select_fields'].indexOf(cfield) >= 0 ) {
                    //console.log(checkedFieldValues[cfield]);
                    var selectId = '#liz-sml-field-' + cfield;
                    for( var cval in checkedFieldValues[cfield] ){
                        var nb = lizSmartLayerConfig.filter_counter[cfield][cval];
                        var option = $(selectId).find('option[value="'+lizMap.cleanName(cval)+'"]');
                        var label = cval;
                        if( !cval || lizMap.cleanName(cval) == '' )
                            label = 'Autre';
                        label = '&nbsp;' + label;
                        if( nb > 0){
                            label+= '&nbsp;(' + nb + ')';
                        }
                        option.html(label);
                        if ( nb == 0 ){
                            option.hide();
                        }
                        else{
                            option.show();
                        }
                    }
                } else {
                    var somechecked = false;
                    for( var cval in checkedFieldValues[cfield] ){
                        var inputId = '#liz-sml-field-' + cfield + '-' + lizMap.cleanName(cval);
                        var nb = lizSmartLayerConfig.filter_counter[cfield][cval];
                        $(inputId).next('span.liz-sml-field-counter').html(nb);

                        // Deactivate item with 0 features
                        $(inputId).parent('span').children().prop('disabled', ( nb == 0 ) );
                        $(inputId).parent('span').toggleClass('disabled', ( nb == 0 ) );
                        $(inputId).toggleClass('disabled', ( nb == 0 ) );

                        // Hide or display depending on status
                        if(lizSmartLayerConfig.hide_zero_items){
                            $(inputId).parent('span').children().toggle(!( nb == 0 ) );
                            $(inputId).parent('span').toggle( !( nb == 0 ) );
                            $(inputId).parent('span').next('br').toggle( !( nb == 0 ) );
                            $(inputId).toggle( !( nb == 0 ) );
                        }
                        // Put checked in bold
                        if( checkedFieldValues[cfield][cval] )
                            $(inputId).parent('span').css('font-weight', 'bold');
                        else
                            $(inputId).parent('span').css('font-weight', 'normal');

                    }
                }
            }
            refreshTotalcount();
        }

        function refreshTotalcount(){
            var total = filteredFeaturesIds.length;
            var has_filter = true;
            if( filteredFeaturesIds.length == 1 && filteredFeaturesIds[0] == -1 ){
                total = 0;
            }
            if( lizMap.lizmapLayerFilterActive === null){
                total = lizSmartLayerConfig['features'].length;
                has_filter = false;
            }
            $('#liz-sml-item-layer-total-count').html(total);

        }

        function getSmartLayerHome(){

            var home = '';
            // Add description
            var lconfig = lizMap.config.layers[lizSmartLayerConfig.layername]
            if( lizSmartLayerConfig['displayLayerDescription'] ){
                var labstract = lconfig['abstract'];
                if(labstract != ''){
                    home+= '<p id="liz-sml-item-layer-abstract">' + labstract + '</p>';
                }
            }

            // Add total feature counter
            var total = filteredFeaturesIds.length;
            if( filteredFeaturesIds.length == 1 && filteredFeaturesIds[0] == -1 )
                total = 0;
            if( !lizMap.lizmapLayerFilterActive )
                total = lizSmartLayerConfig['features'].length;
            home+= '<a href="#" class="liz-sml-show-results"><span id="liz-sml-item-layer-total-count">' + total + '</span> résultats</a>&nbsp;&nbsp;';

            // Add unfilter link
            home+= '<br/><i><a href="#" id="liz-sml-unfilter">Désactiver le filtre</a></i>';

            // Add combobox with all data
            home+= '<div style="padding:0px 10px;" class="tree">';
            for(var f in lizSmartLayerConfig.smartFields){
                var field = lizSmartLayerConfig.smartFields[f];
                home+= '<div class="liz-sml-field-box">';
                var flabel = field;
                if( 'alias' in lconfig
                    && field in lconfig.alias
                    && lconfig.alias[field].trim() != ''
                ){
                    flabel = lconfig.alias[field].trim();
                }
                home+= '<span style="font-weight:bold;">' + flabel +'</span>';

                home+= '<p>';
                if ( lizSmartLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                    home+= '<select id="liz-sml-field-' + field + '" class="liz-sml-field-select">';
                    home+= '<option> --- </option>';
                }
                var fkeys = Object.keys(lizSmartLayerConfig['total_counter'][field]);
                // Order fkeys alphabetically (which means sort checkboxes for each field)
                fkeys.sort();

                // Move 'other' to the end
                var afkeys = []; var other = null;
                for(var k in fkeys){
                    var f_val = fkeys[k];
                    if( f_val.match(lizSmartLayerConfig.other_regexp)
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
                        label = lizSmartLayerConfig.other_label;
                        if(!lizSmartLayerConfig.add_other_item_for_null_values)
                            continue;
                    }
                    if ( lizSmartLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                        home+= '<option value="' + lizMap.cleanName(f_val) +'">';
                    } else {
                        var inputId = 'liz-sml-field-' + field + '-' + lizMap.cleanName(f_val);
                        home+= '<span style="font-weight:normal;">';
                        if( lizSmartLayerConfig.icon_layer_items
                        ){
                            var bg = '';
                            if( field + '@' + f_val in lizSmartLayerConfig.icon_layer_items){
                                var bg = lizSmartLayerConfig.icon_layer_items[field + '@' + f_val];
                                bg = mediaLink + '&path=/'+bg;

                            }
                            home+= '<span style="margin: 0px 2px 0px 0px;display:inline-block;width:20px;background:url('+bg+') no-repeat;background-size:contain;">&nbsp;</span>';
                        }
                        home+= '<button id="' + inputId + '" class="btn checkbox liz-sml-field-value" value="' + lizMap.cleanName(f_val) +'" title="Filtrer"></button>';

                    }
                    home+= '&nbsp;' + label;
                    home+= '&nbsp;(' + '<span class="liz-sml-field-counter">';
                    home+= lizSmartLayerConfig.filter_counter[field][f_val];
                    home+= '</span>' + ')';
                    if ( lizSmartLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                        home+= '</option>';
                    } else {
                        home+= '</span></br>';
                    }

                }
                if ( lizSmartLayerConfig['select_fields'].indexOf(field) >= 0 ) {
                    home+= '</select>';
                }
                home+= '</p>';
                home+= '</div>';

            }
            home+= '</div>';

            return home;
        }

        function showResults(limit, offset){
            var phtml = '<div class="lizmapSmlContent"></div>';
            $('#smlcontent div.menu-content').html(phtml);

            var ptext = '';
            var k = 0;

            if( filteredFeaturesIds.length == [-1] ){
                // Hide results
                //$('#mapmenu li.smlcontent.active a').click();
                return;
            }

            var features = lizSmartLayerConfig['features_with_pkey'];
            var i = 0;

            if(lizSmartLayerConfig.zoom_to_features){
                var x_min = 1000000000, y_min = 1000000000, x_max = -1000000000, y_max = -1000000000;
            }

            for(var a in lizSmartLayerConfig.features_sortable){
                var pk_val = lizSmartLayerConfig.features_sortable[a][0];
                var feature = features[pk_val];
                var fid = feature.id.split('.').pop();

                if( filteredFeaturesIds.length != [] && !($.inArray(fid, filteredFeaturesIds) != -1) ){
                    //console.log( i + ' n est pas dans ffids (-> on passe');
                    continue;
                }

                if(i < offset){
                    continue;
                }
                if(k >= limit){
                    break;
                }

                // Display card
                if ( lizSmartLayerConfig.card_display ) {
                    var card = getCard(
                        pk_val,
                        lizSmartLayerConfig.card_template
                    );
                    $('#smlcontent div.menu-content div.lizmapSmlContent').append(card);
                }

                if(lizSmartLayerConfig.zoom_to_features && feature.geometry){
                    // calculate x_min and co
                    x_min = Math.min( x_min, feature.geometry.coordinates[0]);
                    y_min = Math.min( y_min, feature.geometry.coordinates[1]);
                    x_max = Math.max( x_max, feature.geometry.coordinates[0]);
                    y_max = Math.max( y_max, feature.geometry.coordinates[1]);
                }

                i+=1;
                k+=1;
            }

            $('#liz-sml-item-layer-total-count').text(filteredFeaturesIds.length);

            // Change class for templated divs
            if ( lizSmartLayerConfig.card_display ) {
                $('#smlcontent div.lizmapSmlDiv').toggleClass(
                    'templated',
                    (lizSmartLayerConfig.card_template && lizSmartLayerConfig.card_template.length)
                );
            }

            // Activate detail button
            $('#smlcontent div.menu-content div.lizmapSmlContent button.sml-card-open-detail').click(function(){
                var pkey = $(this).val();
                getCardDetail(pkey);
            });

            // Activate show results link
            $('.liz-sml-show-results').click(function(){
                // Show results
                if( lizMap.checkMobile() )
                    $('#mapmenu li.sml.active a').click();
                $('#mapmenu li.smlcontent:not(.active) a').click();
                return false;
            });

            // Activate unfilter
            $('#liz-sml-unfilter').click(function(){
                // Remove feature info geometry
                removeFeatureInfoGeometry();
                if(lizMap.lizmapLayerFilterActive){
                    $('#layerActionUnfilter').click();
                }
                return false;
            });

            // Show result dock at startup
            if( !lizMap.checkMobile() )
                $('#mapmenu li.smlcontent:not(.active) a').click();


            if(lizSmartLayerConfig.zoom_to_features){
                // Get WFS data projection depending on QGIS Version
                var extent = new OpenLayers.Bounds(x_min, y_min, x_max, y_max);
                var proj = lizMap.config.layers[lizSmartLayerConfig.layername]['featureCrs'];
                // in QGIS server > 2.14 GeoJSON is in EPSG:4326
                if ( 'qgisServerVersion' in lizMap.config.options && lizMap.config.options.qgisServerVersion != '2.14' )
                    proj = 'EPSG:4326';
                else if ( !lizMap.config.layers[lizSmartLayerConfig.layername]['featureCrs'] )
                    proj = lizMap.config.layers[lizSmartLayerConfig.layername]['crs'];
                extent = extent.transform(proj, lizMap.map.getProjection());

                // Zoom to data extent - 1
                // Do not zoom too much to avoid geometry at the side and less visible
                // via a configurable zoom factor
                var targetzoom = Math.max(
                    0,
                    lizMap.map.getZoomForExtent(extent) + lizSmartLayerConfig.zoom_factor
                );
                // Zoom only to a certain maxzoom
                if( lizSmartLayerConfig.max_zoom && targetzoom > lizSmartLayerConfig.max_zoom)
                    targetzoom = lizSmartLayerConfig.max_zoom;
                var targetCenter = extent.getCenterLonLat();
                lizMap.map.zoomTo( targetzoom );
                lizMap.map.setCenter( targetCenter );
                if( lizSmartLayerConfig.map_center_based_on_dock_width && $('#dock:visible').width() ){
                    lizMap.map.moveByPx(-$('#dock').width() / 2, 0)
                }
            }

            // Add export button
            if($('button.exportSmartLayerData').length == 0){
                $('#nav-tab-smlcontent a').append('&nbsp;&nbsp;<button class="btn btn-mini btn-primary exportSmartLayerData">Exporter</button>');
                $('button.exportSmartLayerData').click(function(){
                    lizMap.exportVectorLayer(lizSmartLayerConfig.layername, 'ODS', false); return false;
                });
            }
        }

        function getCard(pkey, template){
            template = typeof template !== 'undefined' ?  template : null;

            var feature = lizSmartLayerConfig.features_with_pkey[pkey];
            var html = '';
            html+= '    <div class="lizmapSmlDiv">';

            // A HTML template is provided
            if( template && template.length > 1 ){
                // Compute the list of words to replace
                var words = feature.properties;
                var reg = '';
                reg+= '\\[ %"';
                reg+= Object.keys(words).join('" %\\]|\\[% "');
                reg+= '" %\\]';
                var re = new RegExp(reg, 'gi');
                // Render HTML car (Replace field names [% ""field" %] with value and media or link with html tags)
                var content = template.replace(re, function(matched){
                    var prop = matched.replace(new RegExp('\\]|\\[|%|"', 'gi'), '').trim();
                    return renderCardHtml(words[prop]);
                });
                html+= content;
                html+= '        <button class="btn btn-mini sml-card-open-detail" value="'+pkey+'">Fiche détaillée</button>';
            }

            // Automatic table display: no template available
            else{
                html+= '    <table class="table table-condensed table-striped table-bordered lizmapPopupTable">';
                html+= '      <tbody>';

                for(var f in lizSmartLayerConfig.card_fields){
                    var field = lizSmartLayerConfig.card_fields[f];
                    html+= '    <tr>';
                    html+= '      <th>'+ lizMap.config.layers[lizSmartLayerConfig.layername]['alias'][field] +'</th>';
                    var fv = feature.properties[field];
                    fv = renderCardHtml(fv);
                    if(!fv)
                        fv = '&nbsp;';
                    html+= '      <td>'+fv+'</td>';
                    html+= '    </tr>';
                }
                html+= '    <tr>';
                html+= '      <td colspan="2" style="text-align:left;">';
                html+= '        <button class="btn btn-mini sml-card-open-detail" value="'+pkey+'">Information</button>';
                html+= '      </td>';
                html+= '    </tr>';
                html+= '        </tbody>';
                html+= '    </table>';
            }

            html+= '</div>';

            return html;
        }

        function renderCardHtml(content){
            if( content == 'null' || content === null  )
                return '';
            if( typeof content != 'string' ){
                return content;
            }

            // Replace http and www by <a>
            if( content && (content.substr(0,4) == 'http' || content.substr(0,3) == 'www') ){
                var rfv = content;
                if(content.substr(0,3) == 'www')
                    rfv = 'http://' + content;
                content = '<a href="' + rfv + '" target="_blank">' + content + '</a>';
            }
            // Replace media images by <img>
            else if( content && content.substr(0,6) == 'media/'){
                content = content.replace(new RegExp(lizSmartLayerConfig.mediaSeparator, 'gi'), ' ').trim();
                content = content.replace(
                    new RegExp('(media/[^ ]*\.(png|jpg|jpeg|gif))( *)?', 'gi'),
                    ('<img class="sml-card-media" src="' + mediaLink + '&path=$1"/>')
                );
            }
            return content;
        }

        function getCardDetail(pkey){

            var feature = lizSmartLayerConfig['features_with_pkey'][pkey];
            lizMap.getFeaturePopupContent(lizSmartLayerConfig.layername, feature, function(data){
                // Add class to table
                var popupReg = new RegExp('lizmapPopupTable', 'g');
                var ptext = data.replace( popupReg, 'table table-condensed table-striped table-bordered lizmapPopupTable');

                // Get feature id
                var hfid = $(ptext).find('input').val();
                var fid = hfid.split('.').pop();

                // Remove h4 title (with layer title)
                var titleReg = new RegExp('<h4>.+</h4>');
                ptext = ptext.replace(titleReg, '');

                // Add popup menu tool if needed
                if( !$('#mapmenu .nav-list > li.popupcontent > a').length ){
                    var dock = 'right-dock';
                    if( lizMap.checkMobile() )
                        dock = 'minidock';
                    lizMap.addDock('popupcontent', 'Popup', dock, '<div class="lizmapPopupContent"/>', 'icon-comment');
                }
                $('#popupcontent div.menu-content div.lizmapPopupContent').html(ptext);

                // Open popup div
                $('#mapmenu li.popupcontent:not(.active) a').click();

                // Add geometry
                if( lizSmartLayerConfig.display_geometry )
                    lizMap.addGeometryFeatureInfo(null);

                // Trigger Lizmap event to add popup toolbar
                lizMap.events.triggerEvent("lizmappopupdisplayed",
                    {'popup': null}
                );

            });
        }

        function launchSmartLayer(){
            // Get html
            var home = getSmartLayerHome(lizSmartLayerConfig.featureType, lizSmartLayerConfig.features);

            // Add dock
            var dock = 'dock';
            if( lizMap.checkMobile() )
                dock = 'minidock';
            lizMap.addDock(
                'sml',
                lizMap.config.layers[lizSmartLayerConfig.layername]['title'],
                dock,
                home,
                'icon-search'
            );
            var title = '<h3>';
            title+= '<i class="icon-search icon-white" style="margin: 4px;"></i>';
            title+= lizMap.config.layers[lizSmartLayerConfig.layername]['title'];
            title+= '</h3>';
            //$('#sml').prepend(title);

            // Add right dock
            if ( lizSmartLayerConfig.card_display ) {
            var dock = 'right-dock';
            if( lizMap.checkMobile() )
                dock = 'minidock';
            lizMap.addDock(
                'smlcontent',
                //lizDict['smartlayer.toolbar.title'],
                lizSmartLayerConfig.result_panel_name,
                dock,
                '',
                'icon-comment'
            );
            }


            // Add events
            activateSmartLayerTrigger();

            // Limit dock size
            adaptSmartLayerSize();

            if( lizSmartLayerConfig['showAtStartup'] ){
                // Show search dock
                $('#mapmenu li.sml:not(.active) a').click();

                // Show result dock if not on mobile
                if(!lizMap.checkMobile())
                    $('#mapmenu li.smlcontent:not(.active) a').click();

            }

            // Hide some buttons
            if( !lizMap.checkMobile() ){
                // Close button of the right-dock panel
                $('#right-dock-close').hide()

            }

            // Add popup menu tool if needed
            if( !$('#mapmenu .nav-list > li.popupcontent > a').length ){
                var dock = 'right-dock';
                if( lizMap.checkMobile() )
                    dock = 'minidock';
                lizMap.addDock('popupcontent', 'Popup', dock, '<div class="lizmapPopupContent"/>', 'icon-comment');
            }

            // MOBILE
            // Add link to toggle mini-dock
            $('#content.mobile #mini-dock div h3 span.title').append('<i style="float:right;" class="icon-chevron-down icon-white"></i>');
            // Mobile mode : The click on the mini-dock H3 minify or magnify the whole div
            $('#content.mobile #mini-dock').on('click', 'div h3', function(){
                if($(this).hasClass('minified') ){
                    $(this).removeClass('minified');
                    $('#content.mobile #mini-dock div.active div.menu-content')
                        .css('height','auto')
                        .css('padding','0.5em')
                    ;
                    $('#content.mobile #mini-dock i.icon-chevron-up').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                }else{
                    $(this).addClass('minified');
                    $('#content.mobile #mini-dock  div.active div.menu-content')
                        .css('height','0px')
                        .css('padding','0px')
                    ;
                    $('#content.mobile #mini-dock i.icon-chevron-down').removeClass('icon-chevron-down').addClass('icon-chevron-up');
                }

            })
            // Hide search panel close x
            $('#content.mobile #sml div.mini-dock-close').hide();
            // Move result count in h3
            $('#content.mobile #sml span.title span ').html('').append($('.liz-sml-show-results'));

            // Show results
            showResults(1000,0);

        }

        function removeFeatureInfoGeometry(){
            if(lizSmartLayerConfig.display_geometry){
                var layer = lizMap.map.getLayersByName('locatelayer');
                if ( layer.length == 1 )
                    layer[0].destroyFeatures();
            }
        }

        function adaptSmartLayerSize(){
            lizMap.events.on({
            // Adapt dock size to display metadata
            dockopened: function(e) {
                if ( e.id == 'sml') {
                    // Size : add class to content to enabled specific css to be applied
                    $('#content').addClass('smlcontent-visible');
                    lizMap.updateContentSize();

                }
            },
            rightdockclosed: function(e) {
                if( e.id == 'sml' ) {
                    // Set right-dock default size by removing #content class
                    $('#content').removeClass('smlcontent-visible');
                    lizMap.updateContentSize();

                    // Do not let the use close the right-dock with results
                    $('#mapmenu li.sml:not(.active) a').click();

                }
                // Show the result right dock when popup is closed
                else if( e.id == 'popupcontent' ) {
                    $('#mapmenu li.smlcontent:not(.active) a').click();
                }

            },
            minidockclosed: function(e) {
                // Show the result right dock when popup is closed
                if( e.id == 'popupcontent' ) {
                    $('#mapmenu li.smlcontent:not(.active) a').click();
                    removeFeatureInfoGeometry();
                }
                // Show the search dock when result is closed
                else if( e.id == 'smlcontent' ) {
                    $('#mapmenu li.sml:not(.active) a').click();
                }
            },
            layerfeatureremovefilter: function(e){

                if(e.featureType == lizSmartLayerConfig.layername){
                    filteredFeaturesIds = [];

                    // We need to uncheck all checkboxes
                    $('.liz-sml-field-value.checked').removeClass('checked');
                    $('#sml span.disabled').removeClass('disabled');
                    $('#sml button.liz-sml-field-value.disabled').removeAttr('disabled').removeClass('disabled');
                    // We need to reset comboboxes
                    $('#sml select.liz-sml-field-select').val( $('#sml select.liz-sml-field-select option:first').val() )

                    countFeatures(false);

                    // And the recalculate the counters
                    updateCounters();

                    // Show corresponding results
                    showResults(1000,0);

                    refreshTotalcount();

                    removeFeatureInfoGeometry();
                }
            },

            lizmappopupdisplayed: function(e){
                // Add back button above popup dock
                if(!lizMap.checkMobile()){
                    $('div#popupcontent div.lizmapPopupContent:first').prepend('<button class="sml-card-close-detail btn btn-mini">Retour</button>');
                    $('div.lizmapPopupContent button.sml-card-close-detail').click(function(){
                        $('#mapmenu li.popupcontent.active a').click();
                        removeFeatureInfoGeometry();
                    })
                }

                // Rename popup title
                $('li#nav-tab-popupcontent a').html(lizSmartLayerConfig.result_panel_name);


                // Add geometry
                if(lizSmartLayerConfig.display_geometry){

                    // On modifie la taille et la couleur du rond autour de l'objet
                    var layer = lizMap.map.getLayersByName('locatelayer');
                    if ( layer.length == 0 )
                        return true;
                    layer = layer[0];
                    var change_style = false;
                    if(
                        lizSmartLayerConfig.geometry_point_color
                        && lizSmartLayerConfig.geometry_point_color != ''
                        && layer.styleMap.styles['default'].defaultStyle.strokeColor != lizSmartLayerConfig.geometry_point_color
                    ){
                        layer.styleMap.styles['default'].defaultStyle.strokeColor = lizSmartLayerConfig.geometry_point_color;
                        change_style = true;
                    }
                    if(
                        lizSmartLayerConfig.geometry_point_size
                        && lizSmartLayerConfig.geometry_point_size != ''
                        && layer.styleMap.styles['default'].defaultStyle.pointRadius != lizSmartLayerConfig.geometry_point_size
                    ){
                        layer.styleMap.styles['default'].defaultStyle.pointRadius = lizSmartLayerConfig.geometry_point_size;
                        change_style = true;
                    }
                    if(change_style)
                        layer.redraw();
                }

            }

            });

        }

        function activateSmartLayerTrigger(){

            $('.liz-sml-field-value').click(function(){
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
                setSmartLayerFilter();
            });

            $('.liz-sml-field-select').change(function(){
                // Count corresponding features based on checked values
                countFeatures(false);
                // Filter the data
                setSmartLayerFilter();
            });

        }

        // Launch SmartLayer feature
        getSmartLayerData(lizSmartLayerConfig.layername);

        } // uicreated
    });


}();

var todo = `
`;
