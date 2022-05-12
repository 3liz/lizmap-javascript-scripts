lizMap.events.on({

    'uicreated': function(e) {
        // Simplify the export options in selection tool

        // List of keeping formats
        // GEOJSON, GML, SHP, TAB, MIF, KML, GPKG, GPX, ODS, XLSX, CSV
        var enabledFormat = ['XLSX', 'ODS', 'CSV'];
       
        $('#selectiontool div.selectiontool-actions div.selectiontool-export ul.selectiontool-export-formats li').filter(function(idx, elt){
            //console.log($(elt).text());
            return enabledFormat.indexOf($(elt).text().toUpperCase()) == -1;
        }).remove();
    },

    'attributeLayerContentReady': function(e) {
        // Simplify the export options in attribute table tab

        // List of keeping formats
        // GEOJSON, GML, SHP, TAB, MIF, KML, GPKG, GPX, ODS, XLSX, CSV
        var enabledFormat = ['XLSX', 'ODS', 'CSV'];
       
        $('#attribute-layer-main-'+e.featureType+' div.attribute-layer-action-bar div.export-formats ul.dropdown-menu li').filter(function(idx, elt){
            //console.log($(elt).text());
            return enabledFormat.indexOf($(elt).text().toUpperCase()) == -1;
        }).remove();
    },

});

