lizMap.events.on({
        'uicreated': function(e) {

        var html = '<span style="font-size:1em;font-weight:bold;">Ajouter une trace</span>';
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
        html+= '    <div class="controls">';
        html+= '      <input type="file" style="margin-bottom:5px;" class="form-control-file" id="myFile" name="myFile" accept=".gpx, .kml">';
        html+= '    </div>';
        html+= '    <br>';

        html+= '    <span style="font-size:1em;font-weight:bold;">Modifier la couche</span><br>';

        html+= '    <div id="controlToggle">';
        html+= '        <div class="btn-group-vertical">';
        html+= '          <button type="button" class="btn" style="width: 170px; margin-bottom: 10px;" value="none" id="noneToggle" >Désactiver édition</button>';
        html+= '          <button type="button" class="btn" style="width: 170px; margin-bottom: 10px;" value="line" id="lineToggle" >Dessiner une trace</button>';
        html+= '          <button type="button" class="btn" style="width: 170px; margin-bottom: 10px;" value="modify" id="modifyToggle">Modifier une trace</button>';
        html+= '            <div class="controls">';
        html+= '                <div hidden>';
        html+= '                    <input id="createVertices" type="checkbox" checked';
        html+= '                           name="createVertices" />';
        html+= '                    <label for="createVertices">allow vertices creation</label>';
        html+= '                </div>';
        html+= '            </div>';
        html+= '          <button type="button" class="btn" style="width: 170px;">Supprimer une trace</button>';
        html+= '          <button type="button" id="clear" style="width: 170px; margin-top:10px;" class="btn btn-light">Reinitialiser la couche</button>';
        html+= '        </div>';
        html+= '    </div>';
        html+= '    <button type="button" id="export" style="margin-top:10px;" class="btn btn-light">Exporter</button><br>';
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
            'Trace GPX',
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
    var save = 0;
    var center;
    var editButton;
    var ext;
    var format;

    function clearControl(){
      for(var key in controls) {
          map.removeControl(controls[key]);
      }
    }

    function createNewLayer(){
      vectors = new OpenLayers.Layer.Vector('GPX Layer', {
        styleMap: myStyles
      });

      controls = {
          point: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.Point),
          line: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.Path),
          polygon: new OpenLayers.Control.DrawFeature(vectors,
                    OpenLayers.Handler.Polygon),
          modify: new OpenLayers.Control.ModifyFeature(vectors)
      };

      for(var key in controls) {
          map.addControl(controls[key]);
      }
    }

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

    createNewLayer();
    map.addLayer(vectors);


    function update() {
        // reset modification mode
        controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
        controls.modify.createVertices = true;
    }

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

  $("#noneToggle").click(function(){
    if(editButton != undefined){
      $("#" + editButton.id).removeClass("btn-inverse");
      editButton = this;
    }else{
      editButton = this;
    }
    console.log(this);
    $("#" + this.id).addClass("btn-inverse");
    toggleControl(this);
  });

  //$("#pointToggle").click(function(){
  //  toggleControl(this);
  //});

  $("#lineToggle").click(function(){
    if(editButton != undefined){
      $("#" + editButton.id).removeClass("btn-inverse");
      editButton = this;
    }else{
      editButton = this;
    }
    console.log(this);
    $("#" + this.id).addClass("btn-inverse");
    toggleControl(this);
  });

  //$("#polygonToggle").click(function(){
  //  toggleControl(this);
  //});

  $("#modifyToggle").click(function(){
    if(editButton != undefined){
      $("#" + editButton.id).removeClass("btn-inverse");
      editButton = this;
    }else{
      editButton = this;
    }
    $("#" + this.id).addClass("btn-inverse");
    toggleControl(this);
  });

  $("#createVertices").change(function(){
    update();
  });

  function addLayerFile(){
    var reader = new FileReader();
    var fileInput = document.querySelector('#myFile');
    var result;
    fileName = $('#myFile')[0].files[0].name;
    ext = fileName.split('.')[1];
    fileName = fileName.split('.')[0];
    if(ext.toLowerCase() == 'gpx'){
        format = (new OpenLayers.Format.GPX());
        console.log('gpx');
    }else if(ext.toLowerCase() == 'kml'){
        format = (new OpenLayers.Format.KML());
        console.log('kml');
    }
    vectors.setName(fileName);
    reader.addEventListener('load', function() {
        result = reader.result;

        var features = format.read(result);

        for(var i in features){
          feat = features[i];
          feat.geometry.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjection());
        }
        vectors.addFeatures(features);
        map.zoomToExtent(vectors.getDataExtent());

      });
      reader.readAsText(fileInput.files[0]);
  }

  $("#myFile").change(function(){
    if(save == 1){
      save = 0;
      addLayerFile();
      }else{
        if(confirm('Une couche est déjà présente, voulez-vous la remplacer ?')){
          vectors.destroyFeatures();
          addLayerFile();
        }
      }
  });

  $("#export").click(function(){
    fileName = prompt("Entrez le nom du fichie", fileName);
    if(fileName != null && fileName != ""){
      var features = vectors.features;
      var features_clone = [];
      for(var i in features){
        feat = features[i];
        feat_clone = feat.clone();
        feat_clone.geometry.transform(map.getProjection(), new OpenLayers.Projection("EPSG:4326"));
        features_clone.push(feat_clone);
      }
      var content = format.write(features_clone);
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', fileName + "." + ext);

      element.style.display = 'none';
      document.body.appendChild(element);
      save = 1;
      element.click();
    }else{
      alert("Export impossible Veuillez saisir un nom de fichier !")
    }
  });
  $("#clear").click(function(){
    if(map.getLayer(vectors.id)){
      if(save == 1){
        vectors.destroyFeatures();
        save = 0;
      }else if(confirm("Une couche non exporter est présente, voulez-vous vider le projet ?")){
        vectors.destroyFeatures();
      }
    }
  });

  $('#lineToggle').click();
}
