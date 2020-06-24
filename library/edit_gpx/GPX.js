lizMap.events.on({

    'uicreated': function(e) {
        // Activate GPX manager tool when the map loads
        var activateGpxOnStartup = true;

        // File format based on extension
        var gpxFileFormat = new OpenLayers.Format.GPX();
        var gpxFileExt = 'ext';

        // Add Dock
        addGpxDock();

        // Activate tools
        initGpxView(activateGpxOnStartup);
    },
    'minidockclosed': function(e) {
        if ( e.id == 'gpx-manager' ) {
            $("#gpx_none_toggle").click();
        }
    }
});

function addGpxDock(){

    // Build HTML interface
    var html = '';
    html+= '<div id="gpx_form_container" style="">';

    html+= '<form class="" id="gpx_form">';
    html+= '<div class="control-group">';

    html+= '    <div class="controls">';
    html+= '        <h4 style="font-weight:bold !important;">Ajouter une trace GPX/KML/GeoJSON</h4>';
    html+= '        <input type="file" style="margin-bottom:5px;" class="form-control-file" id="gpx_file" name="gpx_file" accept=".gpx, .kml, .geojson">';
    html+= '    </div>';

    html+= '    <div id="controlToggle" class="controls">';
    html+= '        <h4 style="font-weight:bold !important;">Modifier les lignes</h4>';
    html+= '        <div style="width:100%;">';
    html+= '            <button type="button" class="btn btn-block" value="none" id="gpx_none_toggle" >Désactiver édition</button>';
    html+= '            <button type="button" class="btn btn-block" value="gpx_line" id="gpx_line_toggle" >Dessiner une trace</button>';
    html+= '            <button type="button" class="btn btn-block" value="gpx_modify" id="gpx_modify_toggle">Modifier une trace</button>';
    html+= '            <button type="button" class="btn btn-block" value="gpx_delete" id="gpx_delete_toggle">Supprimer une trace</button>';
    html+= '            <button type="button" class="btn btn-block" value="clear" id="gpx_clear_layer">Reinitialiser la couche</button>';
    html+= '        </div>';
    html+= '    </div>';

    html+= '    <div class="controls">';
    html+= '        <h4 style="font-weight:bold !important;">Exporter les données</h4>';
    html+= '        <div style="width:100%;">';
    html+= '            <button type="button" id="gpx_export" style="margin-top:10px;" class="btn btn-block">Exporter</button>';
    html+= '        </div>';
    html+= '    </div>';

    html+= '</div>';

    html+= '<div style="display:none;">';
    html+= '    <input id="gpx_create_vertices" type="checkbox" checked';
    html+= '           name="gpx_create_vertices" />';
    html+= '    <label for="gpx_create_vertices">allow vertices creation</label>';
    html+= '</div>';
    html+= '</form>'
    html+= '</div>'

    // Add Lizmap minidock
    lizMap.addDock(
        'gpx-manager',
        'Gestion de traces',
        'minidock',
        html,
        'icon-road'
    );
}

// Initialize GPX manager functions and handlers
function initGpxView(activateGpxOnStartup) {
    var map, vectors, controls, fileName;
    var gpxLayer;
    var defaultFillColor = "yellow";
    var defaultStrokeColor = "orange";
    var defaultStrokeWidth = 5;
    var selectFillColor = "orange";
    var selectStrokeColor = "red";
    var selectStrokeWidth = 5;
    var pointRadius = 6;
    var save = 0;
    var center;
    var editButton;

    // Clear all controls
    function clearControl(){
        for(var key in controls) {
            lizMap.map.removeControl(controls[key]);
        }
    }

    // Create a new gpx OpenLayers vector layer
    function createNewLayer(){
        var myStyles = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style({
                pointRadius: pointRadius,
                fillColor: defaultFillColor,
                strokeColor: defaultStrokeColor,
                strokeWidth: defaultStrokeWidth
            }),
            "select": new OpenLayers.Style({
                pointRadius: pointRadius,
                fillColor: selectFillColor,
                strokeColor: selectStrokeColor,
                strokeWidth: selectStrokeWidth
            })
        });
        vectors = new OpenLayers.Layer.Vector('gpxlayer', {
            styleMap: myStyles
        });

        controls = {
            gpx_point: new OpenLayers.Control.DrawFeature(
                vectors,
                OpenLayers.Handler.Point
            ),
            gpx_line: new OpenLayers.Control.DrawFeature(
                vectors,
                OpenLayers.Handler.Path, {
                    eventListeners: {
                        featureadded: function(event) {
                            $('#lizmap-gpx-message').remove();
                        }
                    }
                }
            ),
            gpx_polygon: new OpenLayers.Control.DrawFeature(
                vectors,
                OpenLayers.Handler.Polygon
            ),
            gpx_modify: new OpenLayers.Control.ModifyFeature(
                vectors
            ),
            gpx_delete: new OpenLayers.Control.SelectFeature(
                vectors,
                {
                    clickout: true, toggle: true,
                    multiple: false, hover: false,
                    box: false,
                    eventListeners: {
                        featurehighlighted: function overlay_delete(event) {
                            var feature = event.feature;
                            if( confirm('Delete selected line ?') ) {
                                vectors.removeFeatures( [ feature ] );
                            }else{
                                this.unselect(feature);
                            }
                        }
                    }
                }
            )
        };

        for(var key in controls) {
            lizMap.map.addControl(controls[key]);
        }
    }

    // Create gpx layer and add it to the map
    createNewLayer();
    lizMap.map.addLayer(vectors);

    // Change modify feature control to allow updating feature
    function update() {
        controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
        controls.modify.gpx_create_vertices = true;
        return false;
    }

    // Toggle control based on element name
    function toggleControl(element) {
        for(key in controls) {
            var control = controls[key];
            if(element.value == key) {
                control.activate();
            } else {
                control.deactivate();
            }
        }
    }

    // Deactivate edition
    $("#gpx_none_toggle").click(function(){
        if(editButton != undefined){
            $("#" + editButton.id).removeClass("btn-info");
            editButton = this;
        }else{
            editButton = this;
        }
        //console.log(this);
        $("#" + this.id).addClass("btn-info");
        toggleControl(this);

        $('#lizmap-gpx-message').remove();

        return false;
    });

    // Activate line drawing control
    $("#gpx_line_toggle").click(function(){
        if(editButton != undefined){
            $("#" + editButton.id).removeClass("btn-info");
            editButton = this;
        }else{
            editButton = this;
        }
        //console.log(this);
        $("#" + this.id).addClass("btn-info");
        toggleControl(this);

        $('#lizmap-gpx-message').remove();
        var msg = 'You can draw one or more lines. Click to add a node, double-click to finish a line';
        lizMap.addMessage(msg,'info',true).attr('id','lizmap-gpx-message');

        return false;
    });

    // Activate modify control
    $("#gpx_modify_toggle").click(function(){
        if(editButton != undefined){
            $("#" + editButton.id).removeClass("btn-info");
            editButton = this;
        }else{
            editButton = this;
        }
        $("#" + this.id).addClass("btn-info");
        toggleControl(this);

        $('#lizmap-gpx-message').remove();
        var msg = 'You can click on one line then use the handles to modify the nodes: drag & drop nodes, clic on a node and use the Del key to delete the node.';
        lizMap.addMessage(msg,'info',true).attr('id','lizmap-gpx-message');

        return false;
    });

    // Activate delete feature control
    $("#gpx_delete_toggle").click(function(){
        if(editButton != undefined){
            $("#" + editButton.id).removeClass("btn-info");
            editButton = this;
        }else{
            editButton = this;
        }
        $("#" + this.id).addClass("btn-info");
        toggleControl(this);

        $('#lizmap-gpx-message').remove();
        var msg = 'You can click on one line to select and delete it';
        lizMap.addMessage(msg,'info',true).attr('id','lizmap-gpx-message');

        return false;
    });

    $("#gpx_create_vertices").change(function(){
        update();
        return false;
    });

    // Read data from given file and add features to the map
    function addLayerFile(){
        var reader = new FileReader();
        var fileInput = document.querySelector('#gpx_file');
        var result;
        var fileName = $('#gpx_file')[0].files[0].name;
        var ext = fileName.split('.')[1];
        fileName = fileName.split('.')[0];
        if(ext.toLowerCase() == 'gpx'){
            format = (new OpenLayers.Format.GPX());
        }else if(ext.toLowerCase() == 'kml'){
            format = (new OpenLayers.Format.KML());
        }else if(ext.toLowerCase() == 'geojson'){
            format = (new OpenLayers.Format.GeoJSON());
        }
        gpxFileFormat = format;
        gpxFileExt = ext;
        vectors.setName(fileName);
        reader.addEventListener('load', function() {
            result = reader.result;
        var features = format.read(result);
            for(var i in features){
                feat = features[i];
                feat.geometry.transform(
                    new OpenLayers.Projection("EPSG:4326"),
                    lizMap.map.getProjection()
                );
            }
            vectors.addFeatures(features);
            lizMap.map.zoomToExtent(vectors.getDataExtent());

            $('#lizmap-gpx-message').remove();
            var msg = 'Data from given file has been successfully added to the map. You can now edit the geometries.';
            lizMap.addMessage(msg,'info',true).attr('id','lizmap-gpx-message');

        });
        reader.readAsText(fileInput.files[0]);
    }

    // Add file data on file change
    $("#gpx_file").change(function(){
        if(save == 1){
            save = 0;
            addLayerFile();
        }else{
            if( vectors.features.length > 0 ){
                if(confirm('Une couche est déjà présente, voulez-vous la remplacer ?')){
                    vectors.destroyFeatures();
                }
            }
            addLayerFile();
        }
    });

    function export_file() {
        fileName = prompt("Entrez le nom du fichier (avec extension .gpx, .geojson ou .kml)", fileName);
        if(fileName != null && fileName != ""){
            var features = vectors.features;
            var features_clone = [];
            for(var i in features){
                feat = features[i];
                feat_clone = feat.clone();
                feat_clone.geometry.transform(
                    lizMap.map.getProjection(),
                    new OpenLayers.Projection("EPSG:4326")
                );
                features_clone.push(feat_clone);
            }
            var pieces = fileName.split('.');
            var ext = pieces[pieces.length-1];
            if(ext.toLowerCase() == 'gpx'){
                format = (new OpenLayers.Format.GPX());
            }else if(ext.toLowerCase() == 'kml'){
                format = (new OpenLayers.Format.KML());
            }else if(ext.toLowerCase() == 'geojson'){
                format = (new OpenLayers.Format.GeoJSON());
            }else {
                alert("Veuillez saisir une extension parmi .gpx, .geojson ou .kml. Exemple: export.kml !")
                export_file();
            }
            gpxFileFormat = format;
            var gpxContent = gpxFileFormat.write(features_clone);
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(gpxContent));
            element.setAttribute('download', fileName);
            element.style.display = 'none';
            document.body.appendChild(element);
            save = 1;
            element.click();
        }else{
            alert("Veuillez saisir un nom de fichier !")
        }
    }

    // Export layers to GPX or KML or GeoJSON
    $("#gpx_export").click(function(){
        export_file();
    });

    // Clear layer: destroy all features
    $("#gpx_clear_layer").click(function(){
        if(lizMap.map.getLayer(vectors.id)){
            if(save == 1){
                vectors.destroyFeatures();
                save = 0;
            }else if(confirm("Une couche non exportée est présente. Souhaitez-vous néanmoins vider le projet ?")){
                vectors.destroyFeatures();
            }
        }
    });

    // Activate drawing on start
    if(activateGpxOnStartup){
        // Show dock
        if( !($('#gpx-manager').hasClass('active')) ){
            $('#mapmenu li.gpx-manager:not(.active) a').click();
        }

        // Activate line drawing
        $('#gpx_line_toggle').click();
    }
}
