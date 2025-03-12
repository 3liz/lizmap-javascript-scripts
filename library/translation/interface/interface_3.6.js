/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

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
