/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
    'lizmapeditionformdisplayed': function(evt){

        // Hide the the future action question at the bottom of a form
        // and use the default
        $('#jforms_view_edition_liz_future_action_label').hide();
        $('#jforms_view_edition_liz_future_action').hide();

        // Hide the dialog to enter coordinate if it's a point layer
        $('#edition-point-coord-form').hide();
     }
});