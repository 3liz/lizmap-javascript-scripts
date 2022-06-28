/*
Author: Francesco Bursi
State: draf
*/
var fiurl = OpenLayers.Util.urlAppend(lizUrls.wms, OpenLayers.Util.getParameterString(lizUrls.params));

lizMap.events.on({
  uicreated: function (e) {
    $("head").append('<script src="https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.js"></script>');
    $("head").append('<link href="https://unpkg.com/mapillary-js@4.0.0/dist/mapillary.css" rel="stylesheet"/>');

    window.setTimeout(initMapillary, 3000);
  },
});

function initMapillary() {
  var mlyMessageTimeoutId;
  var cleanMlyMessage = function () {
    var mlyMessage = $("#mly-message");
    if (mlyMessage.length != 0) {
      mlyMessage.remove();
    }
    mlyMessageTimeoutId = null;
  };
  var addMlyMessage = function (aMessage) {
    if (mlyMessageTimeoutId) {
      window.clearTimeout(mlyMessageTimeoutId);
    }
    cleanMlyMessage();
    lizMap.addMessage(aMessage, "info", true).attr("id", "mly-message");
    mlyMessageTimeoutId = window.setTimeout(cleanMlyMessage, 5000);
  };
  var map = lizMap.map;

  var layer = map.getLayersByName("mapillary-pov");
  
  if (layer.length == 0) {
    layer = new OpenLayers.Layer.Vector("mapillary-pov", {
      styleMap: new OpenLayers.StyleMap({
        graphicName: "triangle",
        pointRadius: 6,
        fill: true,
        fillColor: "red",
        fillOpacity: 0.4,
        stroke: true,
        strokeWidth: 3,
        strokeColor: "red",
        strokeOpacity: 0.8,
        rotation: "${angle}",
      }),
    });
    map.addLayer(layer);
  } else {
    return;
  }
  layer.setVisibility(false);

  var drawCtrl = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Point, {
    eventListeners: {
      activate: function (evt) {
        layer.destroyFeatures();
        layer.setVisibility(true);
      },
      deactivate: function (evt) {},
    },
  });

  var dragCtrl = new OpenLayers.Control.DragFeature(layer, {
    geometryTypes: ["OpenLayers.Geometry.Point"],
    type: OpenLayers.Control.TYPE_TOOL,
    layout: null,
    eventListeners: {
      activate: function (evt) {
        if (this.layout == null) return false;
        layer.setVisibility(true);
      },
      deactivate: function (evt) {
        layer.setVisibility(false);
        layer.destroyFeatures();
      },
    },
    onComplete: function (feature, pixel) {
      layer.events.triggerEvent("featuremodified", { feature: feature });
    },
  });

  map.addControls([drawCtrl, dragCtrl]);

  function activateMlyComponents() {
    viewer.deactivateCover();
    viewer.activateComponent("bearing");
    viewer.activateComponent("image");
    viewer.activateComponent("direction");
    viewer.activateComponent("zoom");
    viewer.activateComponent("attribution");
    //adjust the height, for some reason I'm not able to simply set this element to null
    $('.mapillary-attribution-container').css({height: 'auto'});
    viewer.activateComponent("sequence");
  }

  function deactivateMlyComponents() {
    viewer.deactivateComponent("bearing");
    viewer.deactivateComponent("image");
    viewer.deactivateComponent("direction");
    viewer.deactivateComponent("zoom");
    viewer.deactivateComponent("attribution");
    viewer.deactivateComponent("sequence");
  }

  function activateImagesLayer() {
    $("#layer-images > td:nth-child(1) > button").trigger("click");
  }

  function moveToId(pixelF) {

    // for the momento between one image search and another it shows a black screen
    deactivateMlyComponents();
    var extent = map.getExtent().clone();
    extent = extent.transform(map.getProjection(), "EPSG:3857");
    var bbox = extent.toBBOX();

    let url =
    fiurl +
    "&LAYERS=images&QUERY_LAYERS=images&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&" +
    "BBOX=" + bbox +
    "&FEATURE_COUNT=1&" +
    "HEIGHT=" + Math.ceil($('#map').height()) + "&WIDTH=" + Math.ceil($('#map').width()) +
    "&FORMAT=image%2Fpng&INFO_FORMAT=text%2Fhtml&CRS=EPSG%3A3857&" +
    "I=" + pixelF.x + "&J=" + pixelF.y +
    "&FI_POINT_TOLERANCE=5&FI_LINE_TOLERANCE=1&FI_POLYGON_TOLERANCE=1";

    async function fetchText() {
      try {
        let res = await fetch(url);
        let data = await res.text();

        var parsed = $("<div/>").append(data);

        let elemento = parsed.find(".popupAllFeaturesCompact");
        let actualId;

        for (var i = 0; i < elemento.length; i++) {
          //if ($("h4", elemento[i]).text() != "images") continue;
          actualId = $("table", elemento[i]).find("td:eq( 2 )").text();
          break;
        }
        if (!actualId) {
          console.log("No image here");
          addMlyMessage("No photos found at these coordinates");
          //viewer.activateCover();
          deactivateMlyComponents();
          return;
        }

        await viewer.moveTo(actualId);
        viewer.deactivateCover();
        activateMlyComponents();
        cleanMlyMessage();
        
        
        return;
      } catch (error) {
        console.log(error);
      }
    }

    fetchText();
  }

  layer.events.on({
    featureadded: function (evt) {
      // deactivate draw
      drawCtrl.deactivate();

      // get feature
      var feat = layer.features[0];

      // clone geometry
      var geom = feat.geometry.clone();
      geom.transform(layer.projection, "EPSG:3857");
      var coordinate = new OpenLayers.LonLat(geom.x, geom.y);
      var pixel = map.getPixelFromLonLat(coordinate);

      moveToId(pixel);

      // Update feature
      //feat.attributes.angle = onPov();
      layer.redraw();

      // activate drag
      dragCtrl.activate();
    },
    featuremodified: function (evt) {
      // get feature
      var feat = evt.feature;

      // clone geometry
      var geom = feat.geometry.clone();
      geom.transform(layer.projection, "EPSG:3857");
      var coordinate = new OpenLayers.LonLat(geom.x, geom.y);
      var pixel = map.getPixelFromLonLat(coordinate);

      moveToId(pixel);

      layer.redraw();
    },
  });

  var html = '<div id="mly-pano"></div>';

  lizMap.addDock("demoTool", "Mapillary", "minidock", html, "icon-eye-open");

  var { Viewer } = mapillary;

  var viewer = new Viewer({
    accessToken: "MLY|XXX", //put your token
    container: "mly-pano",
  });

  viewer.on("position", async (event) => {
    if (layer.features.length == 0) {
      deactivateMlyComponents();
      return;
    }

    const position = await viewer.getPosition();

    var pt = new OpenLayers.Geometry.Point(position.lng, position.lat);
    pt.transform("EPSG:4326", layer.projection);

    var feat = layer.features[0];
    feat.geometry.x = pt.x;
    feat.geometry.y = pt.y;
    layer.redraw();

    if (!map.getExtent().scale(0.95).contains(pt.x, pt.y)) {
      map.setCenter([pt.x, pt.y]);
    }
  });

  const onPov = async () => {
    const pov = await viewer.getPointOfView();
    
    if ( layer.features.length == 0 )
            return;

    layer.features[0].attributes.angle = pov.bearing;
    layer.redraw();
    return;
    //return pov.bearing;
  };

  viewer.on('pov', onPov);

  window.addEventListener("resize", function () {
    viewer.resize();
  });

  lizMap.events.on({
    minidockopened: function (e) {
      if (e.id == "demoTool") {
        var headerStyles = window.getComputedStyle(document.getElementById("header"));
        var height, width;

        if (headerStyles.display == "none") {
          // we are in the iframe mode. No header displayed
          var mapStyles = window.getComputedStyle(document.getElementById("map"));
          height = (parseFloat(mapStyles.height) * 45) / 100 - 15;
          width = document.getElementById("mini-dock").getBoundingClientRect().width - 20;
        } else {
          // we are in the normal mode
          var sidemenuStyles = window.getComputedStyle(document.getElementById("mapmenu"));
          var minidockStyles = window.getComputedStyle(document.getElementById("mini-dock"));
          height = (parseFloat(sidemenuStyles.height) * 45) / 100 - 15;
          width = ((parseFloat(headerStyles.width) - parseFloat(sidemenuStyles.width)) * (parseFloat(minidockStyles.maxWidth) - 1)) / 100 - 15;
        }
        lizMap.controls['featureInfo'].deactivate();
        var mlyPano = document.getElementById("mly-pano");
        mlyPano.style.width = width + "px";
        mlyPano.style.height = height + "px";
        viewer.deactivateCover();
        activateImagesLayer();
        drawCtrl.activate();
        addMlyMessage("Click to see a photo");
        viewer.resize();
      }
    },

    minidockclosed: function (e) {
      if (e.id == "demoTool") {
        drawCtrl.deactivate();
        dragCtrl.deactivate();
        activateImagesLayer();
        deactivateMlyComponents();
        viewer.activateCover();
        lizMap.controls['featureInfo'].activate();
      }
    },
  });
}