lizMap.events.on({
        'uicreated': function(e) {

        var html = '<span style="font-size:1em;font-weight:bold;">Ajouter un fichier GPX</span>';
        html+= '<br/>';
        html+= '<br/>';
        html+= '<div id="gpx_form_container" style="">';

        html+= '<form class="" id="gpx_form">';

        // A pied ou en voiture
        html+= '<div class="control-group">';

        //html+= '    <label class="control-label" for="ign_form_graphName">Moyen de locomotion</label>';

        //html+= '</div>';

        // Méthode
        //html+= '<div class="control-group">';
        //html+= '    <label class="sr-only" for="ign_form_method">Méthode</label>';
        html+= '  <div id="controls">';
        html+= '    <span style="font-size:1em;font-weight:bold;">Ajouter une couche </span><br>';
        html+= '    <div class="controls">';
        html+= '      <input type="file" style="margin-bottom:5px;" class="form-control-file" id="myFile" name="myFile" accept=".gpx">';
        html+= '    </div><br>';
        //html+= '    <button type="button" id="import" class="btn btn-light">Importer</button><br><br>';

        html+= '    <span style="font-size:1em;font-weight:bold;">Modifier la couche</span><br>';

        html+= '    <div id="controlToggle">';
        html+= '        <div class="controls">';
        html+= '            <label class="inline-block" for="noneToggle">';
        html+= '              <input type="radio" name="type" value="none" id="noneToggle"';
        html+= '                    checked="checked" />';
        html+= '              Naviguer';
        html+= '            </label>';
        html+= '        </div>';
        html+= '        <div class="controls">';
        html+= '            <label class="inline-block" for="modifyToggle">';
        html+= '              <input type="radio" name="type" value="modify" id="modifyToggle"/>';
        html+= '              Modifier les données';
        html+= '            </label>';
        html+= '            <div class="controls">';
        html+= '                <div hidden>';
        html+= '                    <input id="createVertices" type="checkbox" checked';
        html+= '                           name="createVertices" />';
        html+= '                    <label for="createVertices">allow vertices creation</label>';
        html+= '                </div>';
        html+= '            </div>';
        html+= '        </div>';
        html+= '    </div>';
        html+= '    <button type="button" id="export" style="margin-top:10px;" class="btn btn-light">Exporter</button><br>';
        //html+= '    <input type="file" id="ctrl" webkitdirectory>';
        html+= '</div>';

        // Distance ou temps
        //html+= '<div class="control-group">';

        //html+= '</div>';


        // Reverse
        //html+= '<div class="control-group">';


        html+= '</div>';

        html+= '</form>'
        html+= '</div>'

        lizMap.addDock(
            'GPX',
            'Edit your GPX file',
            'minidock',
            html,
            'icon-road'
        );

        initGpxView();

    }
});

function initGpxView() {
    var map, vectors, controls, fileName;
    var gpxLayer;
    var defaultFillColor = "yellow";
    var defaultStrokeColor = "orange";
    var defaultStrokeWidth = 5;
    var selectFillColor = "orange";
    var selectStrokeColor = "red";
    var selectStrokeWidth = 5;
    var pointRadius = 6;

    map = lizMap.map;
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
    map = map;

    vectors = new OpenLayers.Layer.Vector('test', {
      styleMap: myStyles
    });

    controls = {
        modify: new OpenLayers.Control.ModifyFeature(vectors)
    };

    for(var key in controls) {
        map.addControl(controls[key]);
    }
    document.getElementById('noneToggle').checked = true;

    function update() {
        // reset modification mode
        controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
        controls.modify.createVertices = true;
    }

    function toggleControl(element) {
        for(key in controls) {
            var control = controls[key];
            if(element.value == key && element.checked) {
                control.activate();
              } else {
                control.deactivate();
              }
            }
      }

  $("#noneToggle").click(function(){
    toggleControl(this);
  });

  $("#modifyToggle").click(function(){
    toggleControl(this);
  });

  $("#createVertices").change(function(){
    update();
  });

  $("#myFile").change(function(){
    var reader = new FileReader();
    var fileInput = document.querySelector('#myFile');
    var result;
    fileName = $('#myFile')[0].files[0].name;
    fileName = fileName.split('.')[0];
    vectors.setName(fileName);
    gpxLayer = new OpenLayers.Layer.Vector(fileName, {
      style: {strokeColor: "green", strokeWidth: 5}
    });
    console.log('result');
    reader.addEventListener('load', function() {
        result = reader.result;
        var features = (new OpenLayers.Format.GPX()).read(result);
        for(var i in features){
          feat = features[i];
          feat.geometry.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjection());
        }
        console.log();
        vectors.addFeatures(features);
        map.addLayer(vectors);

    });
    reader.readAsText(fileInput.files[0]);



  });

  $("#export").click(function(){
    fileName = prompt("Entrez le nom du fichie", fileName);
    if(fileName != null && fileName != ""){
      var features = vectors.features;
      var features_clone = [];
      for(var i in features){
        feat = features[i];
        feat_clone = feat.clone()
        feat_clone.geometry.transform(map.getProjection(), new OpenLayers.Projection("EPSG:4326"));
        features_clone.push(feat_clone);
      }
      var gpxContent = (new OpenLayers.Format.GPX).write(features_clone);
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(gpxContent));
      element.setAttribute('download', fileName + ".gpx");

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();
  }else{
    alert("Export impossible Veuillez saisir un nom de fichier !")
  }
  });

  $("#getgeom").click(function(){
    //var layer = getLayer(layers[0]);
    //var features = layer.features();
    if(gpxLayer === undefined){
      alert('Veuillez importer un GPX en premier');
    }else{
      var features = gpxLayer.features;
      for(var i in features){
        var item = features[i];
        if(item.geometry instanceof OpenLayers.Geometry.LineString){
          console.log("ok line");
        }
      }
    }
  });
}
