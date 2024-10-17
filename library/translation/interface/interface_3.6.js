lizMap.events.on({
  uicreated: function() {
    // Rename the layer button
    $("#button-switcher").attr('data-original-title', "Legend");
    $("#nav-tab-switcher a").text("Legend");

    // metadata information
    $("#button-metadata").attr('data-original-title', "More information on the project");
    $("#nav-tab-metadata a").text("More info on the project");
 }
});
